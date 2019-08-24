const { BasicRequestHandler } = require('./basic');

class DefaultRequestHandler extends BasicRequestHandler {
    _handle(sKernel, message) {
        let messageType = message.info.header.msg_type;

        sKernel.logger.warn(`There is no handler defined to handle '${messageType}' messages.`);
    }
}

module.exports = { DefaultRequestHandler };