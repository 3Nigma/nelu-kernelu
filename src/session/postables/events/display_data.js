const { SessionBasicPostable, SessionPostableCategories } = require('../base');

class SessionDisplayDataEvent extends SessionBasicPostable {
    static get type() {
        return 'session_display_data';
    }
    
    constructor(pId, data, metadata, transient) {
        super(pId, SessionPostableCategories.Event);
        this._data = data || {};
        this._metadata = metadata || {};
        this._transient = transient || {};
    }

    get _type() {
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