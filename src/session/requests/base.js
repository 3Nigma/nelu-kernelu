const SessionBasicRequestTypes = {
    ExecuteCode: 'execute_code_request'
};

class SessionBasicRequest {
    constructor(id, type) {
        this._id = id;
        this._type = type;
        this.resolveWith = () => { throw new Error("Call 'run' first."); };
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

    run() {
        return new Promise((accept, _) => {
            this.resolveWith = accept;
        });
    }

    _args() {
        throw new Error(`There are no arguments defined for '${this._type}' session request type.`);
    }
}

module.exports = {
    SessionBasicRequestTypes,
    SessionBasicRequest
};