const { SessionBaseEvent } = require('./base');

class SessionPrintEvent extends SessionBaseEvent {
    static get type() {
        return `session_print_${SessionBaseEvent.name_suffix_marker}`;
    }
    
    constructor(skBridge, what) {
        super(skBridge);
        this._what = what;
    }

    get type() {
        return SessionPrintEvent.type;
    }

    get _args() {
        return {
            what: this._what
        };
    }
}

module.exports = {
    SessionPrintEvent
};