
const { JupyterMessage } = require('../message');

class JupyterExecuteResultMessage extends JupyterMessage {
    static newFor(request, {executionCount, result}) {
        return new JupyterExecuteResultMessage(request.buildResponseInfoFor({
                msg_type: "execute_result"
            }, {}, {
                execution_count: executionCount,
                data: {[result.mimeType]: result.value},
                metadata: {}   // TODO ?
            }));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info);
    }
}

module.exports = { 
    JupyterExecuteResultMessage
};