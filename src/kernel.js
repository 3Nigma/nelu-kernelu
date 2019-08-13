const uuid = require("uuid");

const { zmq, JupyterSocketTypes, JupyterSocket } = require("./kernel/socket");
const { RequestHandlers } = require('./kernel/handlers');
const { Session } = require("./session/session");

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

        // Data socket streams
        this._iopubSocket = new JupyterSocket(JupyterSocketTypes.IOPub, this);
        this._stdinSocket = new JupyterSocket(JupyterSocketTypes.STDIn, this);
        this._shellSocket = new JupyterSocket(JupyterSocketTypes.SHELL, this);
        this._controlSocket = new JupyterSocket(JupyterSocketTypes.CONTROL, this);

        this._iopubSocket.on("message", this._onKernelMessage.bind(this));
        this._stdinSocket.on("message", this._onStdinMessage.bind(this));
        this._shellSocket.on("message", this._onKernelMessage.bind(this));
        this._controlSocket.on("message", this._onKernelMessage.bind(this));

        // Initialize more complex objects
        this._session = new Session({ startupScript });
        this._handlers = new RequestHandlers();
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
    get iopubSocket() {
        return this._iopubSocket;
    }
    get shellSocket() {
        return this._shellSocket;
    }
    get stdinSocket() {
        return this._stdinSocket;
    }
    get controlSocket() {
        return this._controlSocket;
    }

    /**
     * Bind kernel sockets and hook listeners
     */
    bindAndGo() {
        this._shellSocket.bindSync();
        this._controlSocket.bindSync();
        this._stdinSocket.bindSync();
        this._iopubSocket.bindSync();
        this._logger.info('Kernel successfully started and awaiting messages.');
    }

    /**
     * Restart the kernel
     */
    async restart() {
        // TODO: anything else?
        return await this._session.restart();
    }

    /**
     * Destroy kernel
     */
    async destroy() {
        let killCode;

        // TODO(NR) Handle socket `this.stdin` once it is implemented
        this._controlSocket.removeAllListeners();
        this._shellSocket.removeAllListeners();
        this._iopubSocket.removeAllListeners();
        this._hbSocket.removeAllListeners();
        killCode = await this._session.kill();
        this._controlSocket.close();
        this._shellSocket.close();
        this._iopubSocket.close();
        this._hbSocket.close();

        return killCode;
    }

    async _onKernelMessage(origin) {
        let messageType = origin.message.info.header.msg_type;
        let requestHandler = this._handlers.getRequestHandlerByType(messageType);

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
}

module.exports = { Kernel };