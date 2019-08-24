const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterSendCommMessage extends JupyterMessage {
    static newFor(request, id, data) {
        return new JupyterSendCommMessage(request.buildResponseInfoFor({
                msg_type: "comm_msg"
            }, {
                comm_id: id,
                data
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
    JupyterSendCommMessage 
};