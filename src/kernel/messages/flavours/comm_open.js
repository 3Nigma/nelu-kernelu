const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterOpenCommMessage extends JupyterMessage {
    static newFor(request, id, tName, data, meta) {
        return new JupyterOpenCommMessage(request.buildResponseInfoFor({
                msg_type: "comm_open"
            }, {
                comm_id: id,
                target_name: tName,
                data
            }, meta));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info, JupyterSocketTypes.IOPub);
    }
}

module.exports = { 
    JupyterOpenCommMessage 
};