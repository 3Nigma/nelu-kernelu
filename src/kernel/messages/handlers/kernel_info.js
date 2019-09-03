const { BaseRequestHandler } = require('./base');
const { JupyterInfoMessage } = require('../flavours/kernel_info_reply');

const { KernelOutOfExecuteInfoEvent } = require('../../events/kernel_info');

class KernelInfoRequestHandler extends BaseRequestHandler {
    constructor(handlingKernel) {
        super(handlingKernel);
    }
    
    _handle(sKernel, message) {
        const username = message.info.header.username;

        JupyterInfoMessage.newFor(message, sKernel.protocolVersion).sendVia(sKernel);
        new KernelOutOfExecuteInfoEvent(message.info, username).emitThrough(sKernel.session);
    }
}

module.exports = { KernelInfoRequestHandler };