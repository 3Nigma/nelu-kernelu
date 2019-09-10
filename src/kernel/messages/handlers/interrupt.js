const { BaseRequestHandler } = require('./base');

class KernelInterruptRequestHandler extends BaseRequestHandler {
    constructor(handlingKernel) {
        super(handlingKernel);
    }
    
    _handle(sKernel, message) {
        sKernel.session.interrupt();
    }
}

module.exports = { KernelInterruptRequestHandler };