"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localFileGivenFileDbIndexKey = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
const node_crypto_1 = require("@anderjason/node-crypto");
function localFileGivenFileDbIndexKey(directory, key) {
    const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(key)
        .toHashedString()
        .slice(0, 24);
    return node_filesystem_1.LocalFile.givenRelativePath(directory, "indexes", hash.slice(0, 3), `${hash}.json`);
}
exports.localFileGivenFileDbIndexKey = localFileGivenFileDbIndexKey;
//# sourceMappingURL=localFileGivenFileDbIndexKey.js.map