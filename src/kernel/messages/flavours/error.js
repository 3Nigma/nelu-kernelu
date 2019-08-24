const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterErrorMessage extends JupyterMessage {
    static newFor(request, {ename, evalue, stack}) {
        // TODO: validate params to be of proper type

        return new JupyterErrorMessage(request.buildResponseInfoFor({
                msg_type: "error"
            }, {
                ename,
                evalue,
                traceback: stack.split('\n')
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
    JupyterErrorMessage 
};