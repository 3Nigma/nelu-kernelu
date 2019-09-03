const { JupyterKernelStatusTypes, JupyterStatusMessage } = require('../flavours/status');

class BaseRequestHandler {
    constructor(handlingKernel) {
        this._hKernel = handlingKernel;
    }

    async handle(requestMessage) {
        let handleCallResult;
        let notifyOfIdleness = () => JupyterStatusMessage.newFor(requestMessage, JupyterKernelStatusTypes.Idle).sendVia(this._hKernel);
       
        JupyterStatusMessage.newFor(requestMessage, JupyterKernelStatusTypes.Busy).sendVia(this._hKernel);
        handleCallResult = this._handle(this._hKernel, requestMessage);
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
    BaseRequestHandler
};