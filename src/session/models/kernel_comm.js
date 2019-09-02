const EventEmitter = require('events');

const { OutOfExecuteTaskId } = require('../postables/base');
const { SessionCreateCommEvent } = require('../postables/events/comm_create');
const { SessionMessageCommEvent } = require('../postables/events/comm_msg');

/**
 * "message" events are triggered by the kernel and carry comm_msg data
 */
class SessionKernelComm extends EventEmitter {
    static newFor(tId, hostPort, targetName, initialData, metaData) {
        let createCommEvent = new SessionCreateCommEvent(tId, targetName, initialData || {}, metaData || {});

        createCommEvent.postTo(hostPort);
        // TODO: return only after the event has been sent but try not to use Promises since it might make things ugly on the cell side
        return new SessionKernelComm(hostPort, createCommEvent.cId, targetName, initialData);
    }
    
    /**
     * @private 
     */
    constructor(hostPort, cId, targetName, initialData) {
        super();
        this._hostPort = hostPort;
        this._cId = cId;
    }

    get id() {
        return this._cId;
    }

    send(data) {
        // TODO: validate the 'data' param to be a JSON
        let targetingTaskId = OutOfExecuteTaskId;

        if (this._sourceMsgInfo) {
            data = {
                pMessageInfo: this._sourceMsgInfo,
                innerData: data
            };
        } else {
            // Assume in-session response
            targetingTaskId = this._kernel.taskId;
        }
        const commMsg = new SessionMessageCommEvent(targetingTaskId, this._cId, data);

        return commMsg.postTo(this._hostPort);
    }

    _bindTo({ kernel, originatingMessageInfo }) {
        this._kernel = kernel;
        this._sourceMsgInfo = originatingMessageInfo;
    }
}

module.exports = {
    SessionKernelComm
};