"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateKeysByCollection = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
async function updateKeysByCollection(adapter, collectionKey, keys) {
    const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(collectionKey)
        .toHashedString()
        .slice(0, 24);
    if (keys != null && keys.size > 0) {
        const contents = {
            collection: collectionKey,
            keys: Array.from(keys),
        };
        await adapter.setValue(hash, contents);
    }
    else {
        await adapter.deleteKey(hash);
    }
}
exports.updateKeysByCollection = updateKeysByCollection;
//# sourceMappingURL=updateKeysByCollection.js.map