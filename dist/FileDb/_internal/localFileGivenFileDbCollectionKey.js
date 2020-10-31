"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localFileGivenFileDbCollectionKey = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const node_filesystem_1 = require("@anderjason/node-filesystem");
function localFileGivenFileDbCollectionKey(directory, collectionKey) {
    const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(collectionKey)
        .toHashedString()
        .slice(0, 24);
    return node_filesystem_1.LocalFile.givenRelativePath(directory, "collections", hash.slice(0, 3), `${hash}.json`);
}
exports.localFileGivenFileDbCollectionKey = localFileGivenFileDbCollectionKey;
//# sourceMappingURL=localFileGivenFileDbCollectionKey.js.map