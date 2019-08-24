const uuid = require('uuid/v4');

const { SessionBaseEvent } = require('./base');

class SessionCreateCommEvent extends SessionBaseEvent {
    static get type() {
        return `session_create_comm_${SessionBaseEvent.name_suffix_marker}`;
    }
    
    constructor(skBridge, target, data, meta) {
        super(skBridge);
        this._id = uuid().replace(/-/g, '');
        this._target = target;
        this._data = data;
        this._meta = meta;
    }

    get id() {
        return this._id;
    }
    get type() {
        return SessionCreateCommEvent.type;
    }

    get _args() {
        return {
            comm_id: this._id,
            target_name: this._target,
            data: this._data,
            meta: this._meta
        };
    }
}

module.exports = {
    SessionCreateCommEvent
};