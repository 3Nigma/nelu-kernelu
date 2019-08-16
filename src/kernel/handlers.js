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

    /**
     * @todo remove this. It's only kept for implementation reference
     */
    execute_request(request) {
        var displayIds = {};

        this.session.execute(request.content.code, {
            onSuccess: (result) => {
                request.respond(
                    this.shellSocket,
                    "execute_reply", {
                        status: "ok",
                        execution_count: this.executionCount,
                        payload: [], // TODO(NR) not implemented,
                        user_expressions: {}, // TODO(NR) not implemented,
                    }
                );
    
                if (!result.mime) {
                    return;
                }
    
                if (this.hideExecutionResult) {
                    return;
                }
    
                if (this.hideUndefined &&
                    result.mime["text/plain"] === "undefined") {
                    return;
                }
    
                request.respond(
                    this.iopubSocket,
                    "execute_result", {
                        execution_count: this.executionCount,
                        data: result.mime,
                        metadata: {},
                    }
                );
            },
            onError: (result) => {
                request.respond(
                    this.shellSocket,
                    "execute_reply", {
                        status: "error",
                        execution_count: this.executionCount,
                        ename: result.error.ename,
                        evalue: result.error.evalue,
                        traceback: result.error.traceback,
                    }
                );
    
                request.respond(
                    this.iopubSocket,
                    "error", {
                        execution_count: this.executionCount,
                        ename: result.error.ename,
                        evalue: result.error.evalue,
                        traceback: result.error.traceback,
                    }
                );
            },
            beforeRun: () => {
                this._status_busy(request);
                this.executionCount++;
                request.respond(
                    this.iopubSocket,
                    "execute_input", {
                        execution_count: this.executionCount,
                        code: request.content.code,
                    }
                );
            },
            afterRun: () => {
                this._status_idle(request);
            },
            onStdout: (data) => {
                request.respond(
                    this.iopubSocket,
                    "stream", {
                        name: "stdout",
                        text: data.toString(),
                    }
                );
            },
            onStderr: (data) => {
                request.respond(
                    this.iopubSocket,
                    "stream", {
                        name: "stderr",
                        text: data.toString(),
                    }
                );
            },
            onDisplay: (update) => {
                var content = {
                    data: update.mime,
                    metadata: {},
                };
    
                // first call to onDisplay with a display_id sends a display_data
                // subsequent calls send an update_display_data
                var msg_type = "display_data";
                if (update.hasOwnProperty("display_id")) {
                    if (displayIds.hasOwnProperty(update.display_id)) {
                        msg_type = "update_display_data";
                    } else {
                        displayIds[update.display_id] = true;
                    }
    
                    content.transient = {
                        display_id: update.display_id,
                    };
                }
    
                request.respond(this.iopubSocket, msg_type, content);
            },
            onRequest: (message, onReply) => {
                if (!message) {
                    log("REQUEST: Empty request");
                    return;
                }
    
                if (message.clear) {
                    var clearOutput = request.respond(
                        this.iopubSocket, "clear_output", message.clear
                    );
    
                    log("REQUEST: CLEAR_OUTPUT:", clearOutput);
                    return;
                }
    
                if (typeof onReply !== "function") {
                    log("REQUEST: Missing onReply callback");
                    return;
                }
    
                if (message && message.input) {
                    if (!request.content.allow_stdin) {
                        log("REQUEST: STDIN: Frontend does not support stdin requests");
                        onReply(new Error("Frontend does not support stdin requests"));
                        return;
                    }
    
                    var response = request.respond(
                        this.stdinSocket, "input_request", message.input
                    );
    
                    log("REQUEST: STDIN:", response);
                    this.onReplies[response.header.msg_id] = onReply;
                    this.lastActiveOnReply = onReply;
                }
            },
        });
    }
}

module.exports = { RequestHandlers };