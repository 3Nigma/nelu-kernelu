const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterCommInfoReplyMessage extends JupyterMessage {
    static newFor(request, comms) {
        return new JupyterCommInfoReplyMessage(request.buildResponseInfoFor({
                msg_type: "comm_info_reply"
            }, { 
                status: 'ok',
                comms 
            }));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info, JupyterSocketTypes.SHELL);
    }
}

module.exports = { 
    JupyterCommInfoReplyMessage 
};