const util = require('util');

const { BaseRequestHandler } = require('./base');
const { JupyterKernelStreamTypes, JupyterStreamMessage } = require('../flavours/stream');
const { JupyterExecuteInputMessage } = require('../flavours/execute_input');
const { JupyterExecuteReplyMessage } = require('../flavours/execute_reply');
const { JupyterExecuteResultMessage } = require('../flavours/execute_result');
const { JupyterErrorMessage } = require('../flavours/error');

const { SessionPrintEvent } = require('../../../session/postables/events/print');
const { SessionCreateCommEvent } = require('../../../session/postables/events/comm_create');
const { JupyterOpenCommMessage } = require('../flavours/comm_open');
const { SessionMessageCommEvent } = require('../../../session/postables/events/comm_msg');
const { JupyterSendCommMessage } = require('../flavours/comm_msg');
const { SessionDisplayDataEvent } = require('../../../session/postables/events/display_data');
const { JupyterDisplayDataMessage } = require('../flavours/display_data');

class ExecuteRequestHandler extends BaseRequestHandler {
    constructor(handlingKernel) {
        super(handlingKernel);
    }
    
    async _handle(sKernel, message) {
        let codeToRun = message.info.content.code;
        
        sKernel.logger.silly(`Executing ${codeToRun}.`);
        return new Promise((accept, _) => {
            let codeExecutionTask;
            let codeExecutionCount;

            codeExecutionTask = sKernel.session.execute(codeToRun);
            codeExecutionCount = codeExecutionTask.description.args.executionCount;

            JupyterExecuteInputMessage.newFor(message, codeToRun, codeExecutionCount).sendVia(sKernel);
            codeExecutionTask.on(SessionPrintEvent.type, ({ what }) => {
                JupyterStreamMessage.newFor(message, JupyterKernelStreamTypes.Out, util.format(...what)).sendVia(sKernel);
            });
            codeExecutionTask.on(SessionCreateCommEvent.type, ({ comm_id, target_name, data, meta }) => {
                sKernel.session.addCommId(target_name, comm_id);
                JupyterOpenCommMessage.newFor(message, comm_id, target_name, data, meta).sendVia(sKernel);
            });
            codeExecutionTask.on(SessionMessageCommEvent.type, ({ comm_id, data }) => {
                JupyterSendCommMessage.newFor({ oMessage: message, comm_id, data }).sendVia(sKernel);
            });
            codeExecutionTask.on(SessionDisplayDataEvent.type, ({ data, metadata, transient }) => {
                JupyterDisplayDataMessage.newFor(message, data, metadata, transient).sendVia(sKernel);
            });
            codeExecutionTask.run().then(resultingArgs => {
                let execResult = resultingArgs.result.value;

                JupyterExecuteReplyMessage.newFor(message, execResult, codeExecutionCount).sendVia(sKernel);
                if (execResult.type !== 'undefined') {
                    if (execResult.type === 'ok') {
                        JupyterExecuteResultMessage.newFor(message, resultingArgs).sendVia(sKernel);
                    } else {
                        // Assume error
                        JupyterErrorMessage.newFor(message, execResult).sendVia(sKernel);
                    }
                }
                accept();
            });
        });
    }
}

module.exports = { ExecuteRequestHandler };