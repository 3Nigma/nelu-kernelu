const { KernelOutOfExecuteEvent } = require('./base');

class KernelOutOfExecuteMessageCommEvent extends KernelOutOfExecuteEvent {
    static get type() {
        return 'kernel_oos_msg_comm';
    }

    constructor(ksBridge, originatingMsgInfo, cId, data) {
        super();
        this._ksBridge = ksBridge;
        this._sourceMsgInfo = originatingMsgInfo;
        this._cId = cId;
        this._data = data;
    }

    get description() {
        // TODO: refactor this
        return {
            id: 0,
            category: 'event',
            type: KernelOutOfExecuteMessageCommEvent.type,
            parentMessage: this._sourceMsgInfo,
            args: this._args
        };
    }

    get _args() {
        return {
            comm_id: this._cId,
            data: this._data
        };
    }

    send() {
        this._ksBridge.emit(this);
    }
}

module.exports = {
    KernelOutOfExecuteMessageCommEvent
};