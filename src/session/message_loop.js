const vm = require('vm');

const { SessionBasicRequestTypes } = require('./requests/base');
const { SessionExecuteCodeResponse } = require('./responses/execute_code');
const { SessionKernelBrdge } = require('./models/kernel_bridge');

class MessageLoop {
    constructor(hostPort) {
        this._parentPort = hostPort;
        // TODO: obfuscate _kHostPort from the context (random variable name?)
        this._context = vm.createContext({
            ...global, Promise,
            _kHostPort: hostPort, SessionKernelBrdge
        });
    }
    
    start() {
        this._parentPort.on("message", msg => this._handleMessage(msg));
        this._parentPort.on("error", error => {
            // TODO: notify kernel of this and take action
            console.error("Need to implement error handling on the node-session side.");
        });
    }

    _handleMessage({id, type, args}) {
        if (type === SessionBasicRequestTypes.ExecuteCode) {
            let resultMimeType = 'text/plain';
            let promisedEvalResult;
            
            try {
                let rawEvalResult = vm.runInContext([
                    '{',
                        `const kernel = new SessionKernelBrdge(${id}, _kHostPort);`,
                        'const print = kernel.print.bind(kernel);',
                        args.code,
                    '}'
                ].join(''), this._context);
                const tryHtmlResolutionFor = (result) => {
                    let { isHtml, promisedVal } = this._tryResolvingHtmlFrom(result);

                    if (isHtml) {
                        resultMimeType = 'text/html';
                    }
                    return promisedVal;
                };

                if (rawEvalResult instanceof Promise) {
                    promisedEvalResult = rawEvalResult.then(resolvedResult => tryHtmlResolutionFor(resolvedResult));
                } else {
                    promisedEvalResult = tryHtmlResolutionFor(rawEvalResult);
                }
            } catch (err) {
                // TODO
                promisedEvalResult = Promise.resolve(undefined);
            }

            promisedEvalResult.then(evalResult => {
                if (evalResult !== undefined) {
                    evalResult = `${evalResult}`;
                }
                new SessionExecuteCodeResponse(id, args.executionCount, resultMimeType, evalResult).replyTo(this._parentPort);
            });
        }
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