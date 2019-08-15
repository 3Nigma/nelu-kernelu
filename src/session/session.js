const { Worker } = require('worker_threads');
const { MainWorkerPath } = require('./main');

const { SessionBasicRequestTypes } = require('./requests/base');
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

    /**
     * Callback to handle messages from the session server
     */
    _onMessage({id, type, args}) {
        let targetedPendingTask = this._tasks.pendingResolution[id];

        if (targetedPendingTask) {
            if (type === SessionBasicRequestTypes.Print) {
                targetedPendingTask.notifyOfConsoleData(args.what);
            } else {
                targetedPendingTask.resolveWith(args);
            }
        } else {
            // TODO: the provided id does not target a valid pending task
        }
    }

    _runStartupScripts() {
        let startupScripts;

        if (this._startupScript) {
            let stats = fs.lstatSync(this._startupScript);
            if (stats.isDirectory()) {
                let dir = this._startupScript;
                startupScripts = fs.readdirSync(dir).filter((filename) => {
                    let ext = filename.slice(filename.length - 3).toLowerCase();
                    return ext === ".js";
                })
                .sort()
                .map((filename) =>path.join(dir, filename));
            } else if (stats.isFile()) {
                startupScripts = [this._startupScript];
            } else {
                startupScripts = [];
            }
        } else {
            startupScripts = [];
        }
        
        startupScripts.forEach((script) => {
            try {
                let code = fs.readFileSync(script).toString();

                this.execute(code);
            } catch (e) {
                // TODO: log this?
            }
        });
    }
}

module.exports = { Session };
