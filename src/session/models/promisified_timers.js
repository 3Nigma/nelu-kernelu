const vm = require('vm');
const uuid = require('uuid/v4');

class SessionClearableTimer extends Promise {
    constructor (
        timeSetFunc, timeClrFunc, acceptableOnRun, 
        clbOnInterrupt, clbOnTimer, period, callArgs) {
        let remoteAccept;
        let internalTimer;
        
        super((accept, reject) => {
            remoteAccept = accept;
            if (period !== undefined) {
                callArgs.unshift(period);
            }
            internalTimer = timeSetFunc((...args) => {
                const gFuncReferenceId = uuid();
                const gArgsReferenceId = uuid();

                try {
                    global.gFuncReferenceId = clbOnTimer;
                    global.gArgsReferenceId = args;
                    const callbackResult = vm.runInThisContext('global.gFuncReferenceId(...global.gArgsReferenceId)', {
                        breakOnSigint: true
                    });

                    if (acceptableOnRun) {
                        accept(callbackResult);
                        this._thenPromiseAccept(callbackResult);
                    }
                } catch(err) {
                    console.error('SessionClearableTimer error while running callback:', err);
                    if (err.code === 'ERR_SCRIPT_EXECUTION_INTERRUPTED') {
                        clbOnInterrupt(internalTimer);
                    }
                    reject(err);
                    this._thenPromiseReject(err);
                } finally {
                    delete global.gFuncReferenceId;
                    delete global.gArgsReferenceId;
                }
            }, ...callArgs);
        });

        this._thenPromise = new Promise((accept, reject) => {
            this._thenPromiseAccept = accept;
            this._thenPromiseReject = reject;
        });
        this._timeClrFunc = timeClrFunc;
        this._remoteAccept = remoteAccept;
        this._internalTimer = internalTimer;
    }

    then(executor) {
        return this._thenPromise.then(executor);
    }

    _clear() {
        this._timeClrFunc(this._internalTimer);
        this._remoteAccept();
        this._thenPromiseAccept();
    }
}

class PromisifiedImediate extends SessionClearableTimer {
    constructor(clb, ...args) {
        super(setImmediate, clearImmediate, true, 
            () => { /* No-op on interrupt */ }, clb, undefined, args);
    }
}

class PromisifiedInterval extends SessionClearableTimer {
    constructor(clb, period, ...args) {
        super(setInterval, clearInterval, false, 
            (tmr) => {
                clearInterval(tmr);
            }, clb, period, args);
    }
}

class PromisifiedTimeout extends SessionClearableTimer {
    constructor(clb, period, ...args) {
        super(setTimeout, clearTimeout, true, 
            () => { /* No-op on interrupt */ }, clb, period, args);
    }
}

module.exports = {
    PromisifiedImediate,
    PromisifiedInterval,
    SessionClearableTimer,
    PromisifiedTimeout
}