
const { JupyterMessage } = require('../message');

class JupyterShutdownMessage extends JupyterMessage {
    static newFor(request) {
        return new JupyterShutdownMessage(request.buildResponseInfoFor({
                msg_type: "shutdown_reply"
            }, {}, {}));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info);
    }
}

module.exports = {
    JupyterShutdownMessage 
};