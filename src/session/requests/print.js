const { SessionBasicRequest, SessionBasicRequestTypes } = require('./base');

class SessionPrintRequest extends SessionBasicRequest {
    constructor(id, pArgs) {
        super(id, SessionBasicRequestTypes.Print);
        this._printArgs = pArgs;
    }

    _args() {
        return {
            what: this._printArgs
        };
    }
}

module.exports = {
    SessionPrintRequest
};