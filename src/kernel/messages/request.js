const crypto = require("crypto");
const uuid = require("uuid/v4");

const { MessageDelimiter, JupyterMessage } = require('./message');

class JupyterRequestMessage extends JupyterMessage {
    static newFor(zmqMessageFrames, scheme, key) {
        let requestMessage = null;
        let idents = [];
        let msgFrameId;

        scheme = scheme || "sha256";
        key = key || "";
        for (msgFrameId = 0; msgFrameId < zmqMessageFrames.length; msgFrameId++) {
            let frame = zmqMessageFrames[msgFrameId];
            if (frame.toString() === MessageDelimiter) {
                break;
            }
            idents.push(frame);
        }

        if (zmqMessageFrames.length - msgFrameId < 5) {
            // TODO: Not enough message frames
            return null;
        }

        if (zmqMessageFrames[msgFrameId].toString() !== MessageDelimiter) {
            // TODO: Missing delimiter
            return null;
        }

        if (key) {
            let obtainedSignature = zmqMessageFrames[msgFrameId + 1].toString();
            let hmac = crypto.createHmac(scheme, key);
            let expectedSignature;

            hmac.update(zmqMessageFrames[msgFrameId + 2]);
            hmac.update(zmqMessageFrames[msgFrameId + 3]);
            hmac.update(zmqMessageFrames[msgFrameId + 4]);
            hmac.update(zmqMessageFrames[msgFrameId + 5]);
            expectedSignature = hmac.digest("hex");
            if (expectedSignature !== obtainedSignature) {
                // TODO: Handle incorrect message signature
                return null;
            }
        }
        requestMessage = new JupyterRequestMessage({
            idents: idents,
            header: JSON.parse(zmqMessageFrames[msgFrameId + 2]),
            parent_header: JSON.parse(zmqMessageFrames[msgFrameId + 3]),
            content: JSON.parse(zmqMessageFrames[msgFrameId + 5]),
            metadata: JSON.parse(zmqMessageFrames[msgFrameId + 4]),
            buffers: zmqMessageFrames.slice([msgFrameId + 6])
        });

        return requestMessage;
    }

    /**
     * @private
     */
    constructor (info) {
        super(info);
    }

    buildResponseInfoFor(header, meta, content) {
        const requestInfo = this.info;
        const requestInfoHeader = requestInfo.header;

        return Object.assign(requestInfo, {
            header: {
                ...requestInfo.header,
                msg_id: uuid(),
                ...header
            },
            parent_header: requestInfoHeader,
            metadata: meta || {},
            content: content || {}
        });
    }
}

module.exports = { JupyterRequestMessage };