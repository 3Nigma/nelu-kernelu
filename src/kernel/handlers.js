const util = require('util');

const { BasicRequestHandler } = require('./messages/handlers/basic');
const { JupyterKernelStreamTypes, JupyterStreamMessage } = require('./messages/flavours/stream');
const { JupyterInfoMessage } = require('./messages/flavours/kernel_info_reply');
const { JupyterShutdownMessage } = require('./messages/flavours/shutdown_reply');
const { JupyterExecuteReplyMessage } = require('./messages/flavours/execute_reply');
const { JupyterExecuteResultMessage } = require('./messages/flavours/execute_result');
const { SessionPrintEvent } = require('../session/events/print');

class DefaultRequestHandler extends BasicRequestHandler {
    _handle(sKernel, message) {
        let messageType = message.info.header.msg_type;

        sKernel.logger.warn(`There is no handler defined to handle '${messageType}' messages.`);
    }
}

class KernelInfoRequestHandler extends BasicRequestHandler {
    _handle(sKernel, message) {
        JupyterInfoMessage.newFor(message, sKernel.protocolVersion).sendTo(sKernel.shellSocket);
    }
}

class ShutdownRequestHandler extends BasicRequestHandler {
    async _handle(sKernel, message) {
        let doAfterKernelCallback = (code) => {
            JupyterShutdownMessage.newFor(message).sendTo(sKernel.controlSocket);
        };

        if (message.info.content.restart) {
            sKernel.restart(doAfterKernelCallback);
        } else {
            await sKernel.destroy(doAfterKernelCallback);
        }
    }
}

class ExecuteRequestHandler extends BasicRequestHandler {
    async _handle(sKernel, message) {
        let codeToRun = message.info.content.code;
        
        sKernel.logger.silly(`Executing ${codeToRun}.`);
        return new Promise((accept, _) => {
            let codeExecutionTask = sKernel.session.execute(codeToRun);

            codeExecutionTask.on(SessionPrintEvent.name, ({ what }) => {
                JupyterStreamMessage.newFor(message, JupyterKernelStreamTypes.Out, util.format(...what)).sendTo(sKernel.iopubSocket);
            });
            codeExecutionTask.run().then(resultingArgs => {
                JupyterExecuteReplyMessage.newFor(message, codeExecutionTask.description.args.executionCount).sendTo(sKernel.shellSocket);
                if (resultingArgs.result.value !== undefined) {
                    JupyterExecuteResultMessage.newFor(message, resultingArgs).sendTo(sKernel.iopubSocket);
                }
                accept();
            });
        });
    }
}

class RequestHandlers {
    constructor() {
        this._defaultHandler = new DefaultRequestHandler();
        this._handlers = {
            kernel_info_request: new KernelInfoRequestHandler(),
            shutdown_request: new ShutdownRequestHandler(),
            execute_request: new ExecuteRequestHandler()
        };
    }

    getRequestHandlerByType(rawMessageType) {
        let targetedHandler = this._handlers[rawMessageType];

        if (!targetedHandler) {
            targetedHandler = this._defaultHandler;
        }
        return targetedHandler;
    }
}

module.exports = { RequestHandlers };