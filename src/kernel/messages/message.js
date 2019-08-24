const crypto = require("crypto");

const MessageDelimiter = "<IDS|MSG>";

/**
 * Jupyter basic message
 */
class JupyterMessage {
    constructor(info, socketDestinationType) {
        this._info = info;
        this._targetingSocketType = socketDestinationType;
    }

    get info() {
        return Object.assign({}, this._info);
    }

    /**
     * Send this encoded message via a Kernel instance through the appropriate socket
     */
    sendVia(kernel) {
        let sock = kernel.sockets[this._targetingSocketType];
        let scheme = sock.scheme || "sha256";
        let key = sock.key || "";
        let idents = this._info.idents;
        let header = JSON.stringify(this._info.header);
        let parent_header = JSON.stringify(this._info.parent_header);
        let metadata = JSON.stringify(this._info.metadata);
        let content = JSON.stringify(this._info.content);
        let signature = "";

        if (key) {
            let hmac = crypto.createHmac(scheme, key);
            let encoding = "utf8";
            
            hmac.update(Buffer.from(header, encoding));
            hmac.update(Buffer.from(parent_header, encoding));
            hmac.update(Buffer.from(metadata, encoding));
            hmac.update(Buffer.from(content, encoding));
            signature = hmac.digest("hex");
        }

        return sock.send(idents.concat([ // idents
            MessageDelimiter,          // delimiter
            signature,                 // HMAC signature
            header,                    // header
            parent_header,             // parent header
            metadata,                  // metadata
            content,                   // content
        ]).concat(this._info.buffers));
    }
}

module.exports = { 
    MessageDelimiter, 
    JupyterMessage 
};