const { BasicRequestHandler } = require('./basic');
const { KernelOutOfExecuteMessageCommEvent } = require('../../events/comm_msg');

class CommMsgRequestHandler extends BasicRequestHandler {
    _handle(sKernel, message) {
        const { comm_id, data } = message.info.content;

        // Just dispatch this to the session
        new KernelOutOfExecuteMessageCommEvent(message.info, comm_id, data).emitThrough(sKernel.session);
    }
}

module.exports = { 
    CommMsgRequestHandler 
};