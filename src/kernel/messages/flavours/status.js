
const { JupyterMessage } = require('../message');

const JupyterKernelStatusTypes = {
    Busy: 'busy',
    Idle: 'idle',
    Starting: 'starting'
};

class JupyterStatusMessage extends JupyterMessage {
    static newFor(request, jkStatusType) {
        return new JupyterStatusMessage(request.buildResponseInfoFor({
                msg_type: "status"
            }, {}, {
                execution_state: jkStatusType
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
    JupyterKernelStatusTypes,
    JupyterStatusMessage 
};