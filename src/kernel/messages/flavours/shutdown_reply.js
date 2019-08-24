const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterShutdownMessage extends JupyterMessage {
    static newFor(request) {
        return new JupyterShutdownMessage(request.buildResponseInfoFor({
                msg_type: "shutdown_reply"
            }));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info, JupyterSocketTypes.CONTROL);
    }
}

module.exports = {
    JupyterShutdownMessage 
};