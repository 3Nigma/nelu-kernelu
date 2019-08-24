const { SessionBaseEvent } = require('./base');

class SessionMessageCommEvent extends SessionBaseEvent {
    static get type() {
        return `session_msg_comm_${SessionBaseEvent.name_suffix_marker}`;
    }
    
    constructor(skBridge, id, data) {
        super(skBridge);
        this._id = id;
        this._data = data;
    }

    get type() {
        return SessionMessageCommEvent.type;
    }

    get _args() {
        return {
            comm_id: this._id,
            data: this._data
        };
    }
}

module.exports = {
    SessionMessageCommEvent
};