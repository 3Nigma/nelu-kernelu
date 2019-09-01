const { SessionPrintEvent } = require('../postables/events/print');
const { SessionDisplayDataEvent } = require('../postables/events/display_data');
const { SessionKernelComm } = require('../models/kernel_comm');

const { JupyterDisplayableMessage } = require('../models/displayable_message');

class SessionKernelBrdge {
    constructor(commManager, taskId, hostPort) {
        this._commManager = commManager;
        this._tId = taskId;
        this._hostPort = hostPort;

        // Make sure that the commManager is aware of the bridge
        // if required to send messages during the duration of this bridge's lifetime
        commManager._bindTo({ kernel: this });
    }

    get taskId() {
        return this._tId;
    }

    print(...what) {
        if (what.length > 0) {
            new SessionPrintEvent(this.taskId, what).postTo(this._hostPort);
        }
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
        createdComm = SessionKernelComm.newFor(this.taskId, this._hostPort, targetName, initialData, metaData);
        this._commManager.add(createdComm);

        return createdComm;
    }

    display(what) {
        if (what instanceof JupyterDisplayableMessage) {
            let promisedDisplayableContent;
            const toDisplay = what._toDisplay();
            
            if (toDisplay instanceof Promise) {
                promisedDisplayableContent = toDisplay;
            } else {
                promisedDisplayableContent = Promise.resolve(toDisplay);
            }
            return promisedDisplayableContent.then(resolvedToDisplayContent => {
                if (typeof resolvedToDisplayContent !== 'object') {
                    throw new Error("I only know how '_toDisplay' objects or Promises that resolve to such.");
                }
                new SessionDisplayDataEvent(this.taskId, resolvedToDisplayContent).postTo(this._hostPort);
            });
        } else {
            throw new Error("I can only display JupyterDisplayableMessage derived instances.");
        }
    }
}

module.exports = { 
    SessionKernelBrdge
};