const util = require('util');
const { SessionBasicResponse, SessionBasicResponseTypes } = require('./base');

class SessionExecuteCodeResponse extends SessionBasicResponse {
    constructor(id, execCount, mimeType, wasItAborted, result) {
        super(id, SessionBasicResponseTypes.ExecuteCode);
        this._executionCount = execCount;
        this._mimeType = mimeType;

        if (wasItAborted) {
            this._result = {
                type: 'aborted'
            };
        } else {
            if (result === undefined) {
                this._result = {
                    type: 'undefined'
                };
            } else if (result instanceof Error) {
                this._result = {
                    type: 'error',
                    ename: `${result}`.split(':')[0],
                    evalue: result.message,
                    stack: result.stack
                };
            } else if (typeof result === 'object') {
                this._result = {
                    type: 'ok',
                    result: util.inspect(result, {
                        depth: 10,
                        maxArrayLength: 100,
                        breakLength: 120,
                        showHidden: true,
                        showProxy: true
                    })
                };
            } else {
                this._result = {
                    type: 'ok',
                    result: `${result}`
                };
            }
        }
    }

    _args() {
        return {
            executionCount: this._executionCount,
            result: {
                mimeType: this._mimeType,
                value: this._result
            }
        };
    }
}

module.exports = {
    SessionExecuteCodeResponse
};