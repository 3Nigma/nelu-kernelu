const { SessionBaseEvent } = require('./base');

class SessionDisplayDataEvent extends SessionBaseEvent {
    static get type() {
        return `session_display_data_${SessionBaseEvent.name_suffix_marker}`;
    }
    
    constructor(skBridge, data, metadata, transient) {
        super(skBridge);
        this._data = data || {};
        this._metadata = metadata || {};
        this._transient = transient || {};
    }

    get type() {
        return SessionDisplayDataEvent.type;
    }

    get _args() {
        return {
            data: this._data,
            metadata: this._metadata,
            transient: this._transient
        };
    }
}

module.exports = {
    SessionDisplayDataEvent
};