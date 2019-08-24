const { BasicRequestHandler } = require('./basic');
const { JupyterCommInfoReplyMessage } = require('../flavours/comm_info_reply');

class CommInfoRequestHandler extends BasicRequestHandler {
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