const SessionBasicResponseTypes = {
    ExecuteCode: 'execute_code_response'
};

class SessionBasicResponse {
    constructor(id, type) {
        this._id = id;
        this._type = type;
    }

    get id() {
        return this._id;
    }

    get description() {
        return {
            id: this._id,
            type: this._type,
            args: this._args()
        };
    }

    replyTo(destination) {
        destination.postMessage(this.description);
    }

    _args() {
        throw new Error(`There are no arguments defined for '${this._type}' session response type.`);
    }
}

module.exports = {
    SessionBasicResponseTypes,
    SessionBasicResponse
};