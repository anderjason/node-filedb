"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rename = void 0;
const fs = require("fs");
function rename(fromFile, toFile) {
    return new Promise((resolve, reject) => {
        const fromPath = fromFile.toAbsolutePath();
        const toPath = toFile.toAbsolutePath();
        if (fromPath === toPath) {
            resolve();
            return;
        }
        fs.rename(fromPath, toPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
exports.rename = rename;
//# sourceMappingURL=rename.js.map