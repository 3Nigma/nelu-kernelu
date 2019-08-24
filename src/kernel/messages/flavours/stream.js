const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

const JupyterKernelStreamTypes = {
    Out: 'stdout',
    Error: 'stderr'
};

class JupyterStreamMessage extends JupyterMessage {
    static newFor(request, jkStreamType, text) {
        return new JupyterStreamMessage(request.buildResponseInfoFor({
                msg_type: "stream"
            }, {
                name: jkStreamType,
                text
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
    JupyterKernelStreamTypes,
    JupyterStreamMessage 
};