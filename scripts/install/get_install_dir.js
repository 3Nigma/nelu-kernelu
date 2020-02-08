const os = require("os");
const path = require("path");

/**
 * Returns the OS specific install directory
 * https://jupyter-client.readthedocs.io/en/stable/kernels.html?highlight=logo#kernel-specs
 * @returns {string} install directory
 * @throws if attempting to install on any OS other than Windows, Linux or macOS
 */
const getInstallDir = () => {
    const osType = os.type();
    const homeDir = os.homedir();   

    switch (osType) {
        case "Windows_NT":
            return path.join(process.env.APPDATA,'jupyter/kernels');
        case "Darwin":
            return path.join(homeDir, "Library/Jupyter/kernels");
        case "Linux":
            return path.join(homeDir, ".local/share/jupyter/kernels");
        default:
            throw new Error(`Unknown install location for OS: ${osType}`);
    }
}

module.exports = getInstallDir;
