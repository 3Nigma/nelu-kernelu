const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterDisplayDataMessage extends JupyterMessage {
    static newFor(request, data, metadata, transient) {
        return new JupyterDisplayDataMessage(request.buildResponseInfoFor({
                msg_type: "display_data"
            }, {
                data, metadata, transient
            }));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info, JupyterSocketTypes.IOPub);
    }
}

module.exports = { 
    JupyterDisplayDataMessage 
};