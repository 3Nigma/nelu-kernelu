const { SessionKernelComm } = require('../models/kernel_comm');

class SessionCommManager {
    constructor() {
        this._list = [];
    }

    newComm() {
        return this.newCommFor({ targetName: 'jknb.comm' });
    }
    newCommFor({ targetName, initialData, metaData }) {
        let createdComm;
        if (!targetName) {
            throw new Error('A targetName (aka namespace) must be provided in order to open a new kernel comm.');
        }
        initialData = initialData || {};
        metaData = metaData || {};
        if (!this._kernel) {
            throw new Error('CommManager is not binded to any kernel-bridge.');
        }

        createdComm = SessionKernelComm.newFor(this._kernel, targetName, initialData, metaData);
        this._list.push(createdComm);

        return createdComm;
    }

    findBy({ id }) {
        return this._list.find(comm => comm.id === id);
    }

    _bindTo(kernel) {
        this._kernel = kernel;
        this._list.forEach(comm => comm._bindTo({ kernel }));
    }
}

module.exports = {
    SessionCommManager
};