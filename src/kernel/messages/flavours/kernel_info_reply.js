const packageVersion = require('../../../../package.json').version;

const { JupyterMessage } = require('../message');

class JupyterInfoMessage extends JupyterMessage {
    static newFor(request, clientProtocolVersion) {
        let nodeVersion = process.versions.node;
        let jjsVersion = packageVersion;
        let kInfo = {
            "protocol_version": clientProtocolVersion,
            "implementation": "jjavascript",
            "implementation_version": jjsVersion,
            "language_info": {
                "name": "javascript",
                "version": nodeVersion,
                "mimetype": "application/javascript",
                "file_extension": ".js",
            },
            "banner": (
                "JJavascript v" + jjsVersion + "\n" +
                "https://github.com/3Nigma/jjavascript\n"
            ),
            "help_links": [{
                "text": "JJavascript Homepage",
                "url": "https://github.com/3Nigma/jjavascript",
            }]
        };

        return new JupyterInfoMessage(request.buildResponseInfoFor({
                msg_type: "kernel_info_reply"
            }, {}, kInfo));
    }

    /**
     * @private
     */
    constructor(info) {
        super(info);
    }
}

module.exports = {
    JupyterInfoMessage 
};