const { SessionBasicPostable, SessionPostableCategories } = require('../base');

class SessionPrintEvent extends SessionBasicPostable {
    static get type() {
        return 'session_print';
    }

    constructor(pId, what) {
        super(pId, SessionPostableCategories.Event);
        this._what = what;
    }

    get _type() {
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