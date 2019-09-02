const { KernelOutOfExecuteEvent } = require('./base');

class KernelOutOfExecuteMessageCommEvent extends KernelOutOfExecuteEvent {
    static get type() {
        return 'kernel_oos_msg_comm';
    }

    constructor(originatingMsgInfo, cId, data) {
        super(originatingMsgInfo, KernelOutOfExecuteMessageCommEvent.type);
        this._cId = cId;
        this._data = data;
    }

    get _args() {
        return {
            comm_id: this._cId,
            data: this._data
        };
    }
}

module.exports = {
    KernelOutOfExecuteMessageCommEvent
};