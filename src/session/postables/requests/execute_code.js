const { SessionBasicPostable, SessionPostableCategories } = require('../base');

class SessionExecuteCodeRequest extends SessionBasicPostable {
    static get type() {
        return 'kernel_execute_code';
    }

    constructor(id, execCount, code) {
        super(id, SessionPostableCategories.Request);
        this._executionCount = execCount;
        this._code = code;
    }

    get _type() {
        return SessionExecuteCodeRequest.type;
    }

    get _args() {
        return {
            executionCount: this._executionCount,
            code: this._code
        };
    }
}

module.exports = {
    SessionExecuteCodeRequest
};