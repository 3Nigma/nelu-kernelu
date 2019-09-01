const EventEmitter = require('events');

const OutOfExecuteTaskId = 0;

const SessionPostableCategories = {
    Event: 'event',
    Request: 'request'
};

class SessionBasicPostable extends EventEmitter {
    constructor(id, category) {
        super();
        this._id = id;
        this._category = category;
        this.resolveWith = () => { throw new Error("Call 'run' first."); };
    }

    get id() {
        return this._id;
    }

    get description() {
        return {
            id: this._id,
            category: this._category,
            type: this._type,
            args: this._args
        };
    }

    postTo(server) {
        server.postMessage(this.description);
        if (this._category === SessionPostableCategories.Event) {
            // Nothing to wait for. Resolve it here
            try {
                this.resolveWith(null);
            } catch(e) {
                // No-op
            }
        } else {
            // Wait for request to be resolved from outside
        }
    }

    run() {
        return new Promise((accept, _) => {
            this.resolveWith = accept;
        });
    }

    _type() {
        throw new Error('There is no type defined for this session-postable.');
    }

    _args() {
        throw new Error(`There are no arguments defined for '${this._type}' session request type.`);
    }
}

module.exports = {
    OutOfExecuteTaskId,
    SessionPostableCategories,
    SessionBasicPostable
};