const { BaseRequestHandler } = require('./base');

class DefaultRequestHandler extends BaseRequestHandler {
    constructor(handlingKernel) {
        super(handlingKernel);
    }
    
    _handle(sKernel, message) {
        let messageType = message.info.header.msg_type;

        sKernel.logger.warn(`There is no handler defined to handle '${messageType}' messages.`);
    }
}

module.exports = { DefaultRequestHandler };