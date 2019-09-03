const packageVersion = require('../../../../package.json').version;

const { JupyterMessage } = require('../message');
const { JupyterSocketTypes } = require('../../socket');

class JupyterInfoMessage extends JupyterMessage {
    static newFor(request, clientProtocolVersion) {
        let nodeVersion = process.versions.node;
        let jjsVersion = packageVersion;
        let kInfo = {
            "protocol_version": clientProtocolVersion,
            "implementation": "nelu-kernelu",
            "implementation_version": jjsVersion,
            "language_info": {
                "name": "javascript",
                "version": nodeVersion,
                "mimetype": "application/javascript",
                "file_extension": ".js",
            },
            "banner": (
                "nelu-kernelu v" + jjsVersion + "\n" +
                "https://github.com/3Nigma/nelu-kernelu\n"
            ),
            "help_links": [{
                "text": "nelu-kernelu's Homepage",
                "url": "https://github.com/3Nigma/nelu-kernelu",
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