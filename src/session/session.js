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
    _defaultInternalsWith({ logger, protocolVersion, buildNumber, startupScript }) {
        this._logger = logger || this._logger;
        this._executionCount = 1;
        this._startupScript = startupScript || this._startupScript;

        this._tasks = {
            nextId: 1,
            pendingResolution: {}
        };
        this._activeComms = {};

        // Server that runs the code requests for this session
        this._server = new Worker(MainWorkerPath, {
            workerData: {
                jupyterClientVersion: protocolVersion,
                nkBuildNumber: buildNumber
            }
        });
        this._server.on("message", msg => this._onMessage(msg));

        this._runStartupScripts();
    }

    interrupt() {
        // Existing handlers for the event that have been attached via process.on('SIGINT') will be disabled during script execution, 
        // but will continue to work after that.
        // TODO: make sure we issue a SIGINT only when vm is executing. Otherwise, the kernel will either die or the interrupt won't have the expected behaviour
        process.kill(process.pid, 'SIGINT');
    }

    async restart() {
        const killedCode = await this.stop();

        this._defaultInternals();
        return killedCode;
    }

    async stop() {
        return new Promise((resolve, _) => {
            this._server.on("exit", resolve);
            this._server.terminate();
        });
    }

    execute(code) {
        let executeCodeRequest = new SessionExecuteCodeRequest(this._tasks.nextId, this._executionCount, code);

        // Store the request
        this._logger.debug(`Dispatching an ExecuteCodeRequest to the session wrapping: ${code}`);
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
                // OOE messages are meant to hit the execution thread
                this._logger.debug(`Kernel is dispatching an OOE event to the session: ${JSON.stringify(what[0].description)}`);
                this._server.postMessage(what[0].description);
            } else {
                // ... while all other emited things are broadcasted to the instance's listeners
                super.emit(what[0]);
            }
        } else {
            // Default to event broadcasting to the event handlers
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
