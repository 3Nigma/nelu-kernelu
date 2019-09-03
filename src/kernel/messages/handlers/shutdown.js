const { BaseRequestHandler } = require('./base');
const { JupyterShutdownMessage } = require('../flavours/shutdown_reply');

class ShutdownRequestHandler extends BaseRequestHandler {
    constructor(handlingKernel) {
        super(handlingKernel);
    }
    
    async _handle(sKernel, message) {
        let doAfterKernelCallback = (code) => {
            JupyterShutdownMessage.newFor(message).sendVia(sKernel);
        };

        if (message.info.content.restart) {
            sKernel.restart(doAfterKernelCallback);
        } else {
            await sKernel.destroy(doAfterKernelCallback);
        }
    }
}

module.exports = { ShutdownRequestHandler };