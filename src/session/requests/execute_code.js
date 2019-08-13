const { SessionBasicRequest, SessionBasicRequestTypes } = require('./base');

class SessionExecuteCodeRequest extends SessionBasicRequest {
    constructor(id, execCount, code) {
        super(id, SessionBasicRequestTypes.ExecuteCode);
        this._executionCount = execCount;
        this._code = code;
    }

    _args() {
        return {
            executionCount: this._executionCount,
            code: this._code
        };
    }
}

module.exports = {
    SessionExecuteCodeRequest
};