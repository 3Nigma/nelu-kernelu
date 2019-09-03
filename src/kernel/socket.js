const zmq = require("zeromq");

const { JupyterMessage } = require('./messages/message');
const { JupyterRequestMessage } = require('./messages/request');

class WrappedMessageHandler extends Function {
    constructor(handler, wrapper) {
        super('...args', 'return this.__call__(...args)');
        this._handler = handler;
        this._wrapper = wrapper;
        return this.bind(this);
    }

    equals(handler) {
        return (handler instanceof WrappedMessageHandler && this._handler === handler._handler) ||
            this._handler === handler;
    }

    __call__(...msgs) {
        let wrapperResult = this._wrapper(msgs);
        if (wrapperResult && this._handler) {
            this._handler(wrapperResult);
        }
    }
}

class JupyterSocketType {
    constructor(name, zmqSocketType, zmqTestableSocketType, connPropertyName) {
        this._name = name;
        this._type = zmqSocketType;
        this._testableType = zmqTestableSocketType;
        this._connPropName = connPropertyName;
    }

    [Symbol.toPrimitive](hint) {
        if (hint == 'string') {
            return this.name;
        }
        return null;
    }

    get type() {
        return this._type;
    }
    get testableType() {
        return this._testableType;
    }
    get name() {
        return this._name;
    }
    get connectionKey() {
        return this._connPropName;
    }
}

const JupyterSocketTypes = {
    IOPub: new JupyterSocketType("IOPub", "pub", "sub", "iopub_port"),
    STDIn: new JupyterSocketType("STDIn", "router", "dealer", "stdin_port"),
    SHELL: new JupyterSocketType("SHELL", "router", "dealer", "shell_port"),
    CONTROL: new JupyterSocketType("CONTROL", "router", "dealer", "control_port")
};

/**
 * ZMQ socket that parses the Jupyter Messaging Protocol
 */
class JupyterSocket extends zmq.Socket {
    constructor (jsType, { identity, connectionInfo } ) {
        super(jsType.type);
        this.identity = identity;    // ZMQ Identity

        this._jsTypeInfo = jsType;
        this._address = `tcp://${connectionInfo.ip}:${connectionInfo[jsType.connectionKey]}`;
        this._scheme = connectionInfo.signature_scheme.slice("hmac-".length);
        this._key = connectionInfo.key;
        this._listeners = [];
    }

    get name() {
        return this._jsTypeInfo.name;
    }
    get scheme() {
        return this._scheme;
    }
    get key() {
        return this._key;
    }

    bindSync(address) {
        let addressToBindTo = address;

        if (!addressToBindTo) {
            addressToBindTo = this._address;
        }
        super.bindSync(addressToBindTo);
    }

    send(message, flags) {
        let toReturn;

        if (message instanceof JupyterMessage) {
            toReturn = message.sendTo(this, flags);
        } else {
            toReturn = super.send(message, flags);
        }
        return toReturn;
    }

    on(event, listener) {
        let listenerToUse = listener;

        if (event === "message") {
            let _wrappedListener = new WrappedMessageHandler(
                listener, 
                (msgs) => JupyterRequestMessage.newFor(msgs, this._scheme, this._key));
            this._listeners.push(_wrappedListener);
            listenerToUse = _wrappedListener;
        }
        return super.on(event, listenerToUse);
    }

    removeListener(event, listener) {
        let handlerToRemove = listener;

        if (event === "message") {
            let targetedHandlerIndex = this._listeners.findIndex(handler => handler.equals(listener));
            
            if (targetedHandlerIndex !== -1) {
                handlerToRemove = this._listeners[targetedHandlerIndex];
                this._listeners.splice(targetedHandlerIndex, 1);
            }
        }
        return super.removeListener(event, handlerToRemove);
    }

    removeAllListeners(event) {
        if (arguments.length === 0 || event === "message") {
            this._listeners = [];
        }

        return super.removeAllListeners(event);
    }
}

module.exports = { 
    zmq,
    JupyterSocket,
    JupyterSocketTypes
};