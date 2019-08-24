class SessionBaseEvent {
    static get name_suffix_marker() {
        return 'event';
    }

    constructor(skBridge) {
        this._skBridge = skBridge;
    }

    send() {
        return this._skBridge.kLink.postMessage({
            id: this._skBridge.taskId,
            type: this.type,
            args: this._args
        });
    }
}

module.exports = { 
    SessionBaseEvent 
};