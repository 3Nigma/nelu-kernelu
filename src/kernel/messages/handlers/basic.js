const { JupyterKernelStatusTypes, JupyterStatusMessage } = require('../flavours/status');

class BasicRequestHandler {
    constructor() {
        // No-op
    }

    async handle(request) {
        let sourcingKernel = request.kernel;
        let requestMessage = request.message;
        let handleCallResult;
        let notifyOfIdleness = () => JupyterStatusMessage.newFor(requestMessage, JupyterKernelStatusTypes.Idle).sendVia(sourcingKernel);
       
        JupyterStatusMessage.newFor(requestMessage, JupyterKernelStatusTypes.Busy).sendVia(sourcingKernel);
        handleCallResult = this._handle(sourcingKernel, requestMessage);
        if (handleCallResult instanceof Promise) {
            handleCallResult.then(notifyOfIdleness);
        } else {
            notifyOfIdleness();
        }
    }

    _handle(sKernel, message) {
        throw new Error('_handle is not implemented for this RequestHandler');
    }
}

module.exports = {
    BasicRequestHandler
};