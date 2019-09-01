const uuid = require('uuid/v4');

const { SessionBasicPostable, SessionPostableCategories } = require('../base');

class SessionCreateCommEvent extends SessionBasicPostable {
    static get type() {
        return 'session_create_comm';
    }
    
    constructor(pId, target, data, meta) {
        super(pId, SessionPostableCategories.Event);
        this._cId = uuid().replace(/-/g, '');
        this._target = target;
        this._data = data;
        this._meta = meta;
    }

    get cId() {
        return this._cId;
    }

    get _type() {
        return SessionCreateCommEvent.type;
    }
    get _args() {
        return {
            comm_id: this._cId,
            target_name: this._target,
            data: this._data,
            meta: this._meta
        };
    }
}

module.exports = {
    SessionCreateCommEvent
};