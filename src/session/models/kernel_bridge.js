const { SessionPrintEvent } = require('../events/print');
const { SessionCreateCommEvent } = require('../events/comm_create');
const { SessionMessageCommEvent } = require('../events/comm_msg');
const { SessionDisplayDataEvent } = require('../events/display_data');

const { JupyterDisplayableMessage } = require('../models/displayable_message');

class SessionKernelComm {
    static newFor(skBrdige, commManager, targetName, initialData, metaData) {
        let createCommEvent = new SessionCreateCommEvent(skBrdige, targetName, initialData || {}, metaData || {});
        let skComm;

        createCommEvent.send();
        // TODO: return only after the event has been sent but try not to use Promises since it might make things ugly on the cell side
        skComm = new SessionKernelComm(skBrdige, createCommEvent.id, targetName, initialData);
        commManager.push(skComm);
        return skComm;
    }
    
    /**
     * @private 
     */
    constructor(skBrdige, id, targetName, initialData) {
        this._skBridge = skBrdige;
        this._id = id;
    }

    get id() {
        return this._id;
    }

    send(data) {
        // TODO: validate the 'data' param to be a JSON
        return new SessionMessageCommEvent(this._skBridge, this._id, data).send();
    }
}

class SessionKernelBrdge {
    constructor(commManager, taskId, hostPort) {
        this._commManager = commManager;
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
        if (what.length > 0) {
            new SessionPrintEvent(this, what).send();
        }
    }
    newComm() {
        return this.newCommFor({ targetName: 'jknb.comm' });
    }
    newCommFor({ targetName, initialData, metaData }) {
        if (!targetName) {
            throw new Error('A targetName (aka namespace) must be provided in order to open a new kernel comm.');
        }
        initialData = initialData || {};
        metaData = metaData || {};
        return SessionKernelComm.newFor(this, this._commManager, targetName, initialData, metaData);
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
                new SessionDisplayDataEvent(this, resolvedToDisplayContent).send();
            });
        } else {
            throw new Error("I can only display JupyterDisplayableMessage derived instances.");
        }
    }
}

module.exports = { 
    SessionKernelBrdge
};