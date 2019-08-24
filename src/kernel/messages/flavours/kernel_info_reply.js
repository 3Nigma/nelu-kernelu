const packageVersion = require('../../../../package.json').version;

const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterInfoMessage extends JupyterMessage {
    static newFor(request, clientProtocolVersion) {
        let nodeVersion = process.versions.node;
        let jjsVersion = packageVersion;
        let kInfo = {
            "protocol_version": clientProtocolVersion,
            "implementation": "jeyksnib",
            "implementation_version": jjsVersion,
            "language_info": {
                "name": "javascript",
                "version": nodeVersion,
                "mimetype": "application/javascript",
                "file_extension": ".js",
            },
            "banner": (
                "jeyksnib v" + jjsVersion + "\n" +
                "https://github.com/3Nigma/jeyksnib\n"
            ),
            "help_links": [{
                "text": "jeyksnib Homepage",
                "url": "https://github.com/3Nigma/jeyksnib",
            }]
        };

        return new JupyterInfoMessage(request.buildResponseInfoFor({
                msg_type: "kernel_info_reply"
            }, kInfo));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info, JupyterSocketTypes.SHELL);
    }
}

module.exports = {
    JupyterInfoMessage 
};