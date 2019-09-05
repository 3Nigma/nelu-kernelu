class SessionClearableTimer {
    constructor (
        timeSetFunc, timeClrFunc, acceptableOnRun, 
        callbackFunc, period, callArgs) {
        this._timeClrFunc = timeClrFunc;
        
        this._timedPromise = new Promise((accept, _) => {
            this._remoteAccept = accept;
            if (period !== undefined) {
                callArgs.unshift(period);
            }
            this._internalTimeout = timeSetFunc((...args) => {
                const callbackResult = callbackFunc(...args);

                if (acceptableOnRun) {
                    accept(callbackResult);
                }
            }, ...callArgs);
        });
    }

    _clear() {
        this._timeClrFunc(this._internalTimeout);
        this._remoteAccept();
    }

    async _waitForTrigger() {
        return await this._timedPromise;
    }
}

class PromisifiedImediate extends SessionClearableTimer {
    constructor(clb, ...args) {
        super(setImmediate, clearImmediate, true, clb, undefined, args);
    }
}

class PromisifiedInterval extends SessionClearableTimer {
    constructor(clb, period, ...args) {
        super(setInterval, clearInterval, false, clb, period, args);
    }
}

class PromisifiedTimeout extends SessionClearableTimer {
    constructor(clb, period, ...args) {
        super(setTimeout, clearTimeout, true, clb, period, args);
    }
}

module.exports = {
    PromisifiedImediate,
    PromisifiedInterval,
    SessionClearableTimer,
    PromisifiedTimeout
}