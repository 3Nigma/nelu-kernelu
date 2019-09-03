const { BaseRequestHandler } = require('./base');
const { JupyterCommInfoReplyMessage } = require('../flavours/comm_info_reply');

class CommInfoRequestHandler extends BaseRequestHandler {
    constructor(handlingKernel) {
        super(handlingKernel);
    }
    
    _handle(sKernel, message) {
        let targetName = message.info.content.target_name;
        let commInfosForTarget = {};
        
        sKernel.session.getCommIdsBy(targetName).forEach(commId => {
            commInfosForTarget[commId] = { target_name: targetName };
        });
        JupyterCommInfoReplyMessage.newFor(message, commInfosForTarget).sendVia(sKernel);
    }
}

module.exports = { CommInfoRequestHandler };