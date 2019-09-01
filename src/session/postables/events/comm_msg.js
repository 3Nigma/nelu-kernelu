const { SessionBasicPostable, SessionPostableCategories } = require('../base');

class SessionMessageCommEvent extends SessionBasicPostable {
    static get type() {
        return 'session_msg_comm';
    }

    constructor(pId, cId, data) {
        super(pId, SessionPostableCategories.Event);
        this._cId = cId;
        this._data = data;
    }

    get _type() {
        return SessionMessageCommEvent.type;
    }

    get _args() {
        return {
            comm_id: this._cId,
            data: this._data
        };
    }
}

module.exports = {
    SessionMessageCommEvent
};