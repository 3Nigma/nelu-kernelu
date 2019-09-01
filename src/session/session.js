const EventEmitter = require('events');

const { Worker } = require('worker_threads');
const { MainWorkerPath } = require('./main');

const { KernelOutOfExecuteEvent } = require('../kernel/events/base');
const { OutOfExecuteTaskId, SessionPostableCategories } = require('./postables/base');
const { SessionExecuteCodeRequest } = require('./postables/requests/execute_code');

class Session extends EventEmitter {
    constructor (opts) {
        super();
        this._defaultInternalsWith(opts);
    }

    _defaultInternals() {
        this._defaultInternalsWith({});
    }
    _defaultInternalsWith({ startupScript }) {
        this._executionCount = 1;
        this._startupScript = startupScript || this._startupScript;

        this._tasks = {
            nextId: 1,
            pendingResolution: {}
        };
        this._activeComms = {};

        // Server that runs the code requests for this session
        this._server = new Worker(MainWorkerPath);
        this._server.on("message", msg => this._onMessage(msg));

        this._runStartupScripts();
    }

    kill() {
        return new Promise((resolve, _) => {
            this._server.on("exit", resolve);
            this._server.terminate();
        });
    }

    async restart() {
        let killedCode = await this.kill();

        this._defaultInternals();
        return killedCode;
    }

    execute(code) {
        let executeCodeRequest = new SessionExecuteCodeRequest(this._tasks.nextId, this._executionCount, code);

        // Store the request
        this._tasks.pendingResolution[this._tasks.nextId] = executeCodeRequest;
        executeCodeRequest.postTo(this._server);

        // Make sure we advance the indexes
        this._tasks.nextId++;
        this._executionCount++;
        
        return executeCodeRequest;
    }

    emit(...what) {
        if (what.length === 1) {
            if (what[0] instanceof KernelOutOfExecuteEvent) {
                this._server.postMessage(what[0].description);
            } else {
                super.emit(what[0]);
            }
        } else {
            super.emit(...what);
        }
    }

    addCommId(targetName, id) {
        if (!this._activeComms[targetName]) {
            this._activeComms[targetName] = [];
        }
        this._activeComms[targetName].push(id);
    }
    getCommIdsBy(targetName) {
        let toRet = [];

        if (this._activeComms[targetName]) {
            toRet = this._activeComms[targetName];
        }
        return toRet;
    }

    /**
     * Callback that handle messages coming from the VM Executor thread
     */
    _onMessage({id, category, type, args}) {
        if (id === OutOfExecuteTaskId) {
            // An out of session message was received. Unpack its parentHeader before proceeding
            if (category === SessionPostableCategories.Event) {
                this.emit(type, args);
            } else {
                // No-op since out of session task responses are not permitted
            }
        } else {
            let targetedPendingTask = this._tasks.pendingResolution[id];

            if (targetedPendingTask) {
                if (category === SessionPostableCategories.Event) {
                    targetedPendingTask.emit(type, args);
                } else {
                    // For all other message-type, resolve the pending request
                    // TODO: we should also remove it from the list
                    // TODO: only resolve if it's the same type as the initial request
                    //       otherwise maybe create a task to the kernel?
                    targetedPendingTask.resolveWith(args);
                }
            } else {
                // TODO: we should log this. This should never happen
            }
        }
    }

    _runStartupScripts() {
        // TODO
    }
}

module.exports = { Session };
