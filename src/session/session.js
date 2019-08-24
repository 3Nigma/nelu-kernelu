const { Worker } = require('worker_threads');
const { MainWorkerPath } = require('./main');

const { SessionBaseEvent } = require('./events/base');
const { SessionExecuteCodeRequest } = require('./requests/execute_code');

class Session {
    constructor (opts) {
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
     * Callback to handle messages from the session server
     */
    _onMessage({id, type, args}) {
        let targetedPendingTask = this._tasks.pendingResolution[id];

        if (targetedPendingTask) {
            if (type.endsWith(SessionBaseEvent.name_suffix_marker)) {
                targetedPendingTask.emit(type, args);
            } else {
                // For all other message-type, resolve the pending request
                // TODO: we should also remove it from the list
                targetedPendingTask.resolveWith(args);
            }
        } else {
            // TODO: the provided id does not target a valid pending task
        }
    }

    _runStartupScripts() {
        // TODO
    }
}

module.exports = { Session };
