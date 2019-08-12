
const { JupyterMessage } = require('../message');

class JupyterExecuteReplyMessage extends JupyterMessage {
    static newFor(request, executionCount) {
        return new JupyterExecuteReplyMessage(request.buildResponseInfoFor({
                msg_type: "execute_reply"
            }, {}, {
                status: "ok",
                execution_count: executionCount,
                payload: [],            // TODO
                user_expressions: {},   // TODO
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
    JupyterExecuteReplyMessage
};