"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rename = void 0;
const fs = require("fs");
function rename(fromFile, toFile) {
    return new Promise((resolve, reject) => {
        fs.rename(fromFile.toAbsolutePath(), toFile.toAbsolutePath(), (err) => {
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