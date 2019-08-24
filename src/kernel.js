const uuid = require("uuid");

const { zmq, JupyterSocketTypes, JupyterSocket } = require("./kernel/socket");
const { Session } = require("./session/session");
const { DefaultRequestHandler,
        KernelInfoRequestHandler,
        CommInfoRequestHandler,
        ShutdownRequestHandler,
        ExecuteRequestHandler } = require('./kernel/messages/handlers');

/**
 * Implements a Javascript kernel for IPython/Jupyter.
 */
class Kernel {
    constructor({ logger, connection, protocolVersion, startupScript }) {
        this._logger = logger;
        this._connection = connection;
        this._protocolVersion = protocolVersion;

        this._identity = uuid.v4();                         // the kernel's ZMQ identity

        // Socket inits
        // Heart Beating above else
        this._hbSocket = zmq.createSocket("rep", { identity: this._identity });
        this._hbSocket.on("message", this._hbSocket.send);
        this._hbSocket.bindSync(`tcp://${this._connection.ip}:${this._connection.hb_port}`);

        // Setup data socket streams
        this._sockets = {
            [JupyterSocketTypes.IOPub]: new JupyterSocket(JupyterSocketTypes.IOPub, this),
            [JupyterSocketTypes.STDIn]: new JupyterSocket(JupyterSocketTypes.STDIn, this),
            [JupyterSocketTypes.SHELL]: new JupyterSocket(JupyterSocketTypes.SHELL, this),
            [JupyterSocketTypes.CONTROL]: new JupyterSocket(JupyterSocketTypes.CONTROL, this)
        };
        this._sockets[JupyterSocketTypes.IOPub].on("message", this._onKernelMessage.bind(this));
        this._sockets[JupyterSocketTypes.STDIn].on("message", this._onStdinMessage.bind(this));
        this._sockets[JupyterSocketTypes.SHELL].on("message", this._onKernelMessage.bind(this));
        this._sockets[JupyterSocketTypes.CONTROL].on("message", this._onKernelMessage.bind(this));

        // Initialize more complex objects
        this._session = new Session({ startupScript });
        this._handlers = {
            _default: new DefaultRequestHandler(),
            kernel_info_request: new KernelInfoRequestHandler(),
            comm_info_request: new CommInfoRequestHandler(),
            shutdown_request: new ShutdownRequestHandler(),
            execute_request: new ExecuteRequestHandler()
        };
    }

    get logger() {
        return this._logger;
    }
    get identity() {
        return this._identity;
    }
    get session() {
        return this._session;
    }
    get connectionInfo() {
        return this._connection;
    }
    get protocolVersion() {
        return this._protocolVersion;
    }
    get sockets() {
        return this._sockets;
    }

    bindAndGo() {
        Object.values(this._sockets).forEach(socket => socket.bindSync());
        this._logger.info('Kernel successfully started and awaiting messages.');
    }

    async restart() {
        // TODO: anything else?
        return await this._session.restart();
    }

    async destroy() {
        let killCode;

        // TODO(NR) Handle socket `this.stdin` once it is implemented
        Object.values(this._sockets).forEach(socket => socket.removeAllListeners());
        this._hbSocket.removeAllListeners();
        killCode = await this._session.kill();
        Object.values(this._sockets).forEach(socket => socket.close());
        this._hbSocket.close();

        return killCode;
    }

    async _onKernelMessage(origin) {
        let messageType = origin.message.info.header.msg_type;
        let requestHandler = this._getRequestHandlerByType(messageType);

        this._logger.silly(`Received a '${messageType}' message.`);
        try {
            requestHandler.handle(origin);
            this._logger.silly(`Handled`);
        } catch (e) {
            this._logger.error(`Exception in ${messageType} handler: ${e}`);
        }
    }

    _onStdinMessage(origin) {
        // TODO: handle these types of messages at some point
    }

    _getRequestHandlerByType(rawMessageType) {
        let targetedHandler = this._handlers[rawMessageType];

        if (!targetedHandler) {
            targetedHandler = this._handlers._default;
        }
        return targetedHandler;
    }
}

module.exports = { Kernel };