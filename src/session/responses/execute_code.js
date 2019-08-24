const { SessionBasicResponse, SessionBasicResponseTypes } = require('./base');

class SessionExecuteCodeResponse extends SessionBasicResponse {
    constructor(id, execCount, mimeType, result) {
        super(id, SessionBasicResponseTypes.ExecuteCode);
        this._executionCount = execCount;
        this._mimeType = mimeType;

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
        } else {
            this._result = {
                type: 'ok',
                result: `${result}`
            };
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