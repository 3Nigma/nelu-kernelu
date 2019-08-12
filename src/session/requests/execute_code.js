const { SessionBasicRequest, SessionBasicRequestTypes } = require('./base');

const { SessionExecuteCodeResponse } = require('../responses/execute_code');

class SessionExecuteCodeRequest extends SessionBasicRequest {
    constructor(id, execCount, code) {
        super(id, SessionBasicRequestTypes.ExecuteCode, SessionExecuteCodeResponse);
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