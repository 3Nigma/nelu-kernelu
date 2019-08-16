const { SessionPrintEvent } = require('../events/print');

class SessionKernelBrdge {
    constructor(taskId, hostPort) {
        this._tId = taskId;
        this._hostPort = hostPort;
    }

    get taskId() {
        return this._tId;
    }
    get kLink() {
        return this._hostPort;
    }

    print(...what) {
        new SessionPrintEvent(this, what).send();
    } 
}

module.exports = { SessionKernelBrdge };