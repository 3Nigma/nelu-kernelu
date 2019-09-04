const vm = require('vm');
const { MessageChannel } = require('worker_threads');

const { SessionExecuteCodeRequest } = require('./postables/requests/execute_code');
const { KernelOutOfExecuteMessageCommEvent } = require('../kernel/events/comm_msg');
const { KernelOutOfExecuteInfoEvent } = require('../kernel/events/kernel_info');

const { SessionExecuteCodeResponse } = require('./responses/execute_code');
const { SessionKernelComm } = require('./models/kernel_comm');
const { SessionKernelBrdge } = require('./models/kernel_bridge');
const { JupyterDisplayableMessage } = require('./models/displayable_message');
const { SessionCommManager } = require('./models/comm_manager');

const { SessionClearableTimer, 
        PromisifiedImediate,
        PromisifiedInterval,
        PromisifiedTimeout } = require('./models/promisified_timers');

class MessageLoop {
    constructor(hostPort) {
        this._parentPort = hostPort;
        this._username = "unknown";
        this._commManager = new SessionCommManager();

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
            exports, module, require,
            Buffer, URL, URLSearchParams, WebAssembly,
            Promise, Error,

            // Own types and definitions
            SessionClearableTimer,
            SessionKernelBrdge, JupyterDisplayableMessage, 
            SessionKernelComm, SessionCommManager,
            _commManager: this._commManager,
            _kHostPort: hostPort
        });

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
    _handleExecuteCodeRequest({id, args}) {
        let resultMimeType = 'text/plain';
        let promisedEvalResult;
        
        this._executeCodeSourcePort.onmessage = null;
        try {
            let rawEvalResult = vm.runInContext(`{
                    var kernel = new SessionKernelBrdge(${id}, "${this._username}", _kHostPort, _commManager);
                    ${args.code}
                }`, this._context);
            const tryHtmlResolutionFor = (result) => {
                let { isHtml, promisedVal } = this._tryResolvingHtmlFrom(result);

                if (isHtml) {
                    resultMimeType = 'text/html';
                }
                return promisedVal;
            };

            if (rawEvalResult instanceof Promise) {
                promisedEvalResult = rawEvalResult.then(resolvedResult => tryHtmlResolutionFor(resolvedResult));
            } else if (rawEvalResult instanceof SessionClearableTimer) {
                promisedEvalResult = rawEvalResult._waitForTrigger().then(resolvedResult => tryHtmlResolutionFor(resolvedResult));
            } else {
                promisedEvalResult = tryHtmlResolutionFor(rawEvalResult);
            }
        } catch (err) {
            promisedEvalResult = Promise.resolve(err);
        }
        promisedEvalResult.then(evalResult => {
            // Resume the inner code-request queue
            this._executeCodeSourcePort.onmessage = this._handleExecuteCodeRequest.bind(this);
            new SessionExecuteCodeResponse(id, args.executionCount, resultMimeType, evalResult).replyTo(this._parentPort);
        });
    }

    _tryResolvingHtmlFrom(result) {
        let promisedVal;
        let isHtml = false;

        // Note: don't use instanceOf. It looks like Object and Function is not part of the execution context
        //       even though Promise is
        if (typeof result === 'object' && typeof result._toHtml === 'function') {
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