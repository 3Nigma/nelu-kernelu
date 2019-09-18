const fs = require('fs');
const path = require('path');
const getInstallDir = require('./get_install_dir');

/**
 * @class KernelSpec
 * Call the "install" to register the kernel.
 * //https://jupyter-client.readthedocs.io/en/stable/kernels.html?highlight=logo#kernel-specs
 */
class KernelSpec {
    constructor() {
        const entryPath = path.resolve(__dirname, '../../main.js');

        this.argv = [
            "node",
            "--experimental-worker",
            entryPath,
            "--connection-file",
            "{connection_file}",
        ];
        this.display_name = "JavaScript (Node.js)";
        this.language = "JavaScript";
    }

    /**
     * Creates an installation folder (if it doesn't exist) and writes 
     * all necessary files for identifying the kernel inside it.
     */
    install() {
        const { argv, display_name, language } = this;
        const { kernelDir, jsonPath, imgDir } = this._getIntsallPaths();

        if (!fs.existsSync(kernelDir)) {
            fs.mkdirSync(kernelDir, { recursive: true });
        }

        const kernelSpec = JSON.stringify({ argv, display_name, language });
        fs.writeFileSync(jsonPath, kernelSpec);
        this._copyLogos(imgDir, kernelDir);
    }

    /**
     * Returns an object containing all paths necessary for installation
     * @returns {object} paths
     * @returns {string} paths.kernelDir - "javascript" kernel directory
     * @returns {string} paths.jsonPath - "kernel.json" file
     * @returns {string} paths.imgDir - logos directory
     */
    _getIntsallPaths() {
        const installDir = getInstallDir();
        const kernelDir = path.join(installDir, "javascript");
        const jsonPath = path.join(kernelDir, "kernel.json");
        const imgDir = path.resolve(__dirname, '../../imgs/nodejs');
        return { kernelDir, jsonPath, imgDir };
    }

    /**
     * Copies the logo image files
     * @param {string} srcDir - source folder path containing the logos
     * @param {string} destDir - destination folder
     */
    _copyLogos(srcDir, destDir) {
        const logos = ['logo-32x32.png', 'logo-64x64.png'];
        logos.forEach(logo => {
            const src = path.join(srcDir, logo);
            const dest = path.join(destDir, logo);
            fs.copyFileSync(src, dest);
        });
    }
}

module.exports = KernelSpec;
