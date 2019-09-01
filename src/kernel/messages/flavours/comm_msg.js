const uuid = require("uuid/v4");

const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterSendCommMessage extends JupyterMessage {
    static newFor({ oMessage, pMessageInfo, comm_id, data }) {
        let toReturn;
        
        if (oMessage) {
            toReturn = new JupyterSendCommMessage(oMessage.buildResponseInfoFor({
                    msg_type: "comm_msg"
                }, { comm_id, data }));
        } else if (pMessageInfo) {
            toReturn = new JupyterSendCommMessage(Object.assign(pMessageInfo, {
                parent_header: pMessageInfo.header,
                header: { 
                    ...pMessageInfo.header,
                    msg_id: uuid(),
                    msg_type: "comm_msg" 
                },
                content: { 
                    comm_id, 
                    data 
                }
            }));
        } else {
            // TODO: now what? no originating message nor parent message info was supplied
            //       this should never happen, but we can't continue
        }

        return toReturn;
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