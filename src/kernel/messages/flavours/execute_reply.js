const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterExecuteReplyMessage extends JupyterMessage {
    static newFor(request, result, executionCount) {
        let metadata = {};
        let content = {
            status: result.type
        };

        if (result.type === 'aborted') {
            // It looks like only 'aborted' executions have the status provided in the meta
            metadata = Object.assign(metadata, {
                status: result.type
            });
        } else {
            // execution_count, payload and user_expressions is only present int the non-aborted cells
            content = Object.assign(content, {
                execution_count: executionCount,
                payload: [],            // TODO
                user_expressions: {},   // TODO
            });
        }
        if (result.type === 'error') {
            content = Object.assign(content, {
                evalue: result.evalue,
                ename: result.ename,
                traceback: result.stack.split('\n')
            });
        }

        return new JupyterExecuteReplyMessage(
            request.buildResponseInfoFor({ msg_type: "execute_reply" }, content, metadata)
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