const { OutOfExecuteTaskId, SessionPostableCategories } = require('../../session/postables/base');

class KernelOutOfExecuteEvent {
    constructor(parentMsgInfo, type) {
        this._sourceMsgInfo = parentMsgInfo;
        this._type = type;
    }

    get description() {
        return {
            id: OutOfExecuteTaskId,
            category: SessionPostableCategories.Event,
            type: this._type,
            parentMessage: this._sourceMsgInfo,
            args: this._args
        };
    }

    emitThrough(ksBridge) {
        ksBridge.emit(this);
    }

    _type() {
        throw new Error('There is no type defined for this OOE event.');
    }

    _args() {
        throw new Error(`There are no arguments defined for this '${this._type}' out-of-execute event type.`);
    }
}

module.exports = {
    KernelOutOfExecuteEvent
};