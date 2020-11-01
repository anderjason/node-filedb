"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateKeysByCollection = void 0;
async function updateKeysByCollection(adapter, collectionKey, keys) {
    if (keys != null && keys.size > 0) {
        const contents = {
            collection: collectionKey,
            keys: Array.from(keys),
        };
        await adapter.setValue(collectionKey, contents);
    }
    else {
        await adapter.deleteKey(collectionKey);
    }
}
exports.updateKeysByCollection = updateKeysByCollection;
//# sourceMappingURL=updateKeysByCollection.js.map