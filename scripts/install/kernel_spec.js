const fs = require('fs');
const path = require('path');
const getInstallDir = require('./get_install_dir');

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

    install() {       
        const { kernelDir, jsonPath, imgDir } = this._getIntsallPaths();

        if (!fs.existsSync(kernelDir)) {
            fs.mkdirSync(kernelDir);
        }

        const kernelSpec = JSON.stringify({
            argv: this.argv,
            display_name: this.display_name,
            language: this.language
        });

        fs.writeFileSync(jsonPath, kernelSpec);

        this._copyLogos(imgDir, kernelDir);
    }

    _getIntsallPaths() {
        const installDir = getInstallDir();
        const kernelDir = path.join(installDir, "javascript");
        const jsonPath = path.join(kernelDir, "kernel.json");
        const imgDir = path.resolve(__dirname, '../../imgs/nodejs');
        return { kernelDir, jsonPath, imgDir };
    }

    _copyLogos(fromDir, toDir) {
        const logos = ['logo-32x32.png', 'logo-64x64.png'];
        logos.forEach(logo => {
            const from = path.join(fromDir, logo);
            const to = path.join(toDir, logo);
            fs.copyFileSync(from, to);
        });
    }
}

module.exports = KernelSpec;
