class SessionClearableTimer {
    constructor(setFun, clrFun, callbackFunc, period, callArgs) {
        this._timeSetFunc = setFun;
        this._timeClrFunc = clrFun;

        this._timedPromise = new Promise((accept, _) => {
            this._remoteAccept = accept;
            if (period !== undefined) {
                callArgs.unshift(period);
            }
            this._internalTimeout = this._timeSetFunc((...args) => {
                accept(callbackFunc(...args));
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
        super(setImmediate, clearImmediate, clb, undefined, args);
    }
}

class PromisifiedInterval extends SessionClearableTimer {
    constructor(clb, period, ...args) {
        super(setInterval, clearInterval, clb, period, args);
    }
}

class PromisifiedTimeout extends SessionClearableTimer {
    constructor(clb, period, ...args) {
        super(setTimeout, clearTimeout, clb, period, args);
    }
}

module.exports = {
    PromisifiedImediate,
    PromisifiedInterval,
    SessionClearableTimer,
    PromisifiedTimeout
}