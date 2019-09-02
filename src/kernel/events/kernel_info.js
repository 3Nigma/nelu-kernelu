const { KernelOutOfExecuteEvent } = require('./base');

class KernelOutOfExecuteInfoEvent extends KernelOutOfExecuteEvent {
    static get type() {
        return 'kernel_oos_kernel_info';
    }

    constructor(originatingMsgInfo, username) {
        super(originatingMsgInfo, KernelOutOfExecuteInfoEvent.type);
        this._username = username;
    }

    get _args() {
        return {
            username: this._username
        };
    }
}

module.exports = {
    KernelOutOfExecuteInfoEvent
};