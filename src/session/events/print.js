class SessionPrintEvent {
    static get name() {
        return 'session_print_event';
    }
    
    constructor(skBridge, what) {
        this._skBridge = skBridge;
        this._what = what;
    }

    send() {
        return this._skBridge.kLink.postMessage({
            id: this._skBridge.taskId,
            type: SessionPrintEvent.name,
            args: {
                what: this._what
            }
        });
    }
}

module.exports = {
    SessionPrintEvent
};