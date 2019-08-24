const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterExecuteInputMessage extends JupyterMessage {
    static newFor(request, code, execution_count) {
        return new JupyterExecuteInputMessage(request.buildResponseInfoFor({
                msg_type: "execute_input"
            }, {
                code,
                execution_count
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
    JupyterExecuteInputMessage
};