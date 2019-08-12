const { SessionBasicResponse, SessionBasicResponseTypes } = require('./base');

class SessionExecuteCodeResponse extends SessionBasicResponse {
    constructor(id, execCount, mimeType, result) {
        super(id, SessionBasicResponseTypes.ExecuteCode);
        this._executionCount = execCount;
        this._mimeType = mimeType;
        this._result = result;
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