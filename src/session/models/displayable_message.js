class JupyterDisplayableMessage {
    _toDisplay() {
        throw new Error("Nothing to display. Please overwrite '_toDisplay'.");    
    }
}

module.exports = { JupyterDisplayableMessage };