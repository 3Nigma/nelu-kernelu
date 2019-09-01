class SessionCommManager {
    constructor() {
        this._list = [];
    }

    _bindTo(kernel) {
        this._list.forEach(comm => comm._bindTo(kernel));
    }
    add(comm) {
        this._list.push(comm);
    }
    findBy({ id }) {
        return this._list.find(comm => comm.id === id);
    }
}

module.exports = {
    SessionCommManager
};