"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localFileGivenFileDbKey = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
function localFileGivenFileDbKey(directory, key) {
    return node_filesystem_1.LocalFile.givenRelativePath(directory, "data", key.slice(0, 3), `${key}.json`);
}
exports.localFileGivenFileDbKey = localFileGivenFileDbKey;
//# sourceMappingURL=localFileGivenFileDbKey.js.map