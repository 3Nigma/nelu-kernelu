const { isMainThread, parentPort, workerData } = require('worker_threads');

if (!isMainThread) {
    const { MessageLoop } = require('./message_loop');

    new MessageLoop(parentPort, workerData).start();
}

module.exports = {
    MainWorkerPath: require('path').dirname(require.main.filename) + '/src/session/main.js'
}