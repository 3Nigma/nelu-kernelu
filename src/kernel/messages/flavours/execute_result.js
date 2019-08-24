const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterExecuteResultMessage extends JupyterMessage {
    static newFor(request, {executionCount, result}) {
        return new JupyterExecuteResultMessage(request.buildResponseInfoFor({
                msg_type: "execute_result"
            }, {
                execution_count: executionCount,
                data: {[result.mimeType]: result.value.result},
                metadata: {}   // TODO ?
            }));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info, JupyterSocketTypes.IOPub);
    }
}

module.exports = { 
    JupyterExecuteResultMessage
};