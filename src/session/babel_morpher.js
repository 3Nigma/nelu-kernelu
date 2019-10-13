const babel = require("@babel/core");
const babelTypes = require("@babel/types");
const babelGenerate = require("@babel/generator");

class BabelCodeMorpher {
    morph(code) {
        return new Promise((accept, reject) => {
            babel.parse(code, (err, ast) => {
                if (err) reject(err);
                else {
                    babel.traverse(ast, {
                        ClassDeclaration(path) {
                            // Top level class declarations are morphed from 'class A {...}' into
                            // 'A = class {...}' so that multiple execution of the same code cells 
                            // having the same class declarations will work
                            if (babelTypes.isProgram(path.parent) === true) {
                                const classNameIdentifier = babelTypes.identifier(path.node.id.name);
                                const classExpression = babelTypes.classExpression(null, null, path.node.body);
            
                                path.replaceWith(babelTypes.assignmentExpression("=", classNameIdentifier, classExpression));
                            }
                        }
                    });
            
                    accept(babelGenerate.default(ast).code);
                }
            });
        });
    }
}

module.exports = {
    BabelCodeMorpher
};