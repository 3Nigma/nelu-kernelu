const vm = require('vm');
const fs = require('fs');
const { MessageChannel, receiveMessageOnPort } = require('worker_threads');

const { SessionExecuteCodeRequest } = require('./postables/requests/execute_code');
const { KernelOutOfExecuteMessageCommEvent } = require('../kernel/events/comm_msg');
const { KernelOutOfExecuteInfoEvent } = require('../kernel/events/kernel_info');

const { SessionExecuteCodeResponse } = require('./responses/execute_code');
const { SessionKernelComm } = require('./models/kernel_comm');
const { SessionKernelBrdge } = require('./models/kernel_bridge');
const { JupyterDisplayableMessage } = require('./models/displayable_message');
const { SessionCommManager } = require('./models/comm_manager');
const { BabelCodeMorpher } = require('./babel_morpher');

const { SessionClearableTimer, 
        PromisifiedImediate,
        PromisifiedInterval,
        PromisifiedTimeout } = require('./models/promisified_timers');

function getVersionNameFrom(jClientVersion) {
    let versionName = jClientVersion;

    if (typeof jClientVersion === 'string' && jClientVersion.split('.').length === 2) {
        versionName += '.0';
    }
    return versionName;
}

class MessageLoop {
    constructor(hostPort, { startupScript, jupyterClientVersion, nkBuildNumber }) {
        this._parentPort = hostPort;
        this._versionName = getVersionNameFrom(jupyterClientVersion);
        this._buildNumber = nkBuildNumber;
        this._username = "unknown";
        this._commManager = new SessionCommManager();
        this._codeMorpher = new BabelCodeMorpher();

        // TODO: obfuscate _kHostPort/_commManager from the context (random variable name?)
        this._context = vm.createContext({
            // Built in elements
            console,
            __dirname, __filename,
            setImmediate: (f, ...args) => new PromisifiedImediate(f, ...args), 
            setInterval: (f, time, ...args) => new PromisifiedInterval(f, time, ...args), 
            setTimeout: (f, time, ...args) => new PromisifiedTimeout(f, time, ...args),
            clearImmediate: (t) => { if (t instanceof SessionClearableTimer) t._clear(); else clearImmediate(t) }, 
            clearInterval: (t) => { if (t instanceof SessionClearableTimer) t._clear(); else clearInterval(t) }, 
            clearTimeout: (t) => { if (t instanceof SessionClearableTimer) t._clear(); else clearTimeout(t) },
            exports, module, 
            require: (id) => {
                const finalRequirePath = require.resolve(id, {
                    paths: [ process.cwd() ]
                });
                
                return require(finalRequirePath);
            },
            Buffer, URL, URLSearchParams, WebAssembly,
            Promise, Error,

            // Own types and definitions
            SessionClearableTimer,
            SessionKernelBrdge, JupyterDisplayableMessage, 
            SessionKernelComm, SessionCommManager,
            _commManager: this._commManager,
            _kHostPort: hostPort
        });

        try {
            // Load the startup-script (if available and valid)
            if (typeof startupScript === 'string' && fs.accessSync(startupScript, fs.constants.R_OK) === undefined) {
                const scriptContent = fs.readFileSync(startupScript);
                
                vm.runInContext(scriptContent, this._context);
            }
        } catch (err) {
            console.error(`There was an issue executing the startup-script: ${err}`);
        }

        // Need an inner queue for handling (long-lasting) execute-code requests
        const { port1, port2 } = new MessageChannel();
        this._executeCodeSinkPort = port1;
        this._executeCodeSourcePort = port2;
        this._executeCodeSourcePort.onmessage = this._handleExecuteCodeRequest.bind(this);
    }
    
    start() {
        this._parentPort.on("message", msg => {
            if (msg && msg.category === 'request' && msg.type === SessionExecuteCodeRequest.type) {
                this._executeCodeSinkPort.postMessage(msg);
            } else {
                // Route the message to the default non-blocking handler
                this._handleMessage(msg);
            }
        });
        this._parentPort.on("error", error => {
            // TODO: notify kernel of this and take action
            console.error("Need to implement error handling on the node-session side.");
        });
    }

    _handleMessage({id, category, type, parentMessage, args}) {
        if (category === 'event') {
            switch(type) {
                case KernelOutOfExecuteMessageCommEvent.type:
                    const { comm_id, data } = args;
                    const targetingComm = this._commManager.findBy({id: comm_id });
                    
                    if (targetingComm !== undefined) {
                        targetingComm._bindTo({ originatingMessageInfo: parentMessage });
                        targetingComm.emit("message", { data });
                    }
                    break;
                case KernelOutOfExecuteInfoEvent.type:
                    const { username } = args;

                    if ("username" !== username) {
                        this._username = username;
                    } else {
                        // Discard this info-update since it's not providing anything useful
                    }
                    break;
                default:
                    console.log(`'${type}' is not handled in the session MessageLoop.`);
            }
        } else if (category === 'request') {
            // TODO: implement stuff as appropriate
        }
    }

    /**
     * Note: This method assumes that category === 'request' and type === SessionExecuteCodeRequest.type
     * 
     * @param {} - task id and code to excute 
     */
    async _handleExecuteCodeRequest(msgEvent) {
        const {id, args} = msgEvent.data;
        let resultMimeType = 'text/plain';
        let promisedEvalResult;

        this._executeCodeSourcePort.onmessage = null;
        try {
            let codeToRun;
            let rawEvalResult;
            const tryHtmlResolutionFor = (result) => {
                let { isHtml, promisedVal } = this._tryResolvingHtmlFrom(result);

                if (isHtml) {
                    resultMimeType = 'text/html';
                }
                return promisedVal;
            };

            try {
                codeToRun = await this._codeMorpher.morph(args.code);
            } catch {
                codeToRun = args.code;
            }
            rawEvalResult = vm.runInContext(`{
                    var kernel = new SessionKernelBrdge(${id}, "${this._versionName}", ${this._buildNumber}, 
                        "${this._username}", _kHostPort, _commManager);
                    ${codeToRun}
                }`, this._context, {
                    breakOnSigint: true
                });

            if (rawEvalResult instanceof Promise) {
                promisedEvalResult = rawEvalResult.then(resolvedResult => tryHtmlResolutionFor(resolvedResult));
            } else {
                promisedEvalResult = tryHtmlResolutionFor(rawEvalResult);
            }
        } catch (err) {
            promisedEvalResult = Promise.reject(err);
        }
        promisedEvalResult.then(evalResult => {
            new SessionExecuteCodeResponse(id, args.executionCount, resultMimeType, false, evalResult).replyTo(this._parentPort);
        }).catch(err => {
            if (err.code === 'ERR_SCRIPT_EXECUTION_INTERRUPTED') {
                // Resolve all pending executions to 'aborted' and discard whatever else we have in the kernel-port
                let portMessages = [];
                let pendingMessage;

                // Try to flush both the inner-code execution port (when long lasting op is pending as a event loop callback eg. via timer callback) and
                // the main executor one
                while((pendingMessage = receiveMessageOnPort(this._executeCodeSourcePort)) !== undefined) {
                    portMessages.push(pendingMessage);
                }
                while((pendingMessage = receiveMessageOnPort(this._parentPort)) !== undefined) {
                    portMessages.push(pendingMessage);
                }

                // Process all pending messages in a single loop
                portMessages.forEach(portMessage => {
                    const pendingPortMessage = portMessage.message;
                    if (pendingPortMessage.category === 'request' && pendingPortMessage.type === SessionExecuteCodeRequest.type) {
                        const {id, args} = pendingPortMessage;

                        new SessionExecuteCodeResponse(id, args.executionCount, resultMimeType, true).replyTo(this._parentPort);
                    }
                });
            }
            console.error('Evaluator execution exception occured:', err);
            new SessionExecuteCodeResponse(id, args.executionCount, resultMimeType, false, err).replyTo(this._parentPort);
        }).finally(() => {
            // Resume the inner code-request queue
            this._executeCodeSourcePort.onmessage = this._handleExecuteCodeRequest.bind(this);
        });
    }

    _tryResolvingHtmlFrom(result) {
        let promisedVal;
        let isHtml = false;

        // Note: don't use instanceOf. It looks like Object and Function is not part of the execution context
        //       even though Promise is
        if (result !== null && typeof result === 'object' && typeof result._toHtml === 'function') {
            let resolvedResultOfHtml = result._toHtml();

            isHtml = true;
            if (resolvedResultOfHtml instanceof Promise) {
                promisedVal = resolvedResultOfHtml;
            } else {
                promisedVal = Promise.resolve(resolvedResultOfHtml);
            }
        } else {
            promisedVal = Promise.resolve(result);
        }

        return { isHtml, promisedVal };
    }
}

module.exports = { MessageLoop };