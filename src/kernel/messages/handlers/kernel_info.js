const { BasicRequestHandler } = require('./basic');
const { JupyterInfoMessage } = require('../flavours/kernel_info_reply');

class KernelInfoRequestHandler extends BasicRequestHandler {
    _handle(sKernel, message) {
        JupyterInfoMessage.newFor(message, sKernel.protocolVersion).sendVia(sKernel);
    }
}

module.exports = { KernelInfoRequestHandler };