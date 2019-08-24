const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterExecuteReplyMessage extends JupyterMessage {
    static newFor(request, result, executionCount) {
        let content = {
            execution_count: executionCount,
            payload: [],            // TODO
            user_expressions: {},   // TODO
        };

        if (result.type === 'error') {
            content = Object.assign(content, {
                status: "error",
                evalue: result.evalue,
                ename: result.ename,
                traceback: result.stack.split('\n')
            });
        } else {
            content = Object.assign(content, {
                status: "ok"
            });
        }

        return new JupyterExecuteReplyMessage(
            request.buildResponseInfoFor({ msg_type: "execute_reply" }, content)
        );
    }

    /**
     * @private
     */
    constructor(info) {
        super(info, JupyterSocketTypes.SHELL);
    }
}

module.exports = { 
    JupyterExecuteReplyMessage
};