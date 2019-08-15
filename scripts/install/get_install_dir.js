const os = require("os");
const path = require("path");

const getInstallDir = () => {
    const osType = os.type();
    const homeDir = os.homedir();   

    switch (osType) {
        case "Windows_NT":
            return "%APPDATA%\\jupyter\\kernels";
        case "Darwin":
            return path.join(homeDir, "Library/Jupyter/kernels");
        case "Linux":
            return path.join(homeDir, ".local/share/jupyter/kernels");
        default:
            throw new Error(`Unknown install location for OS: ${osType}`);
    }
}

module.exports = getInstallDir;
