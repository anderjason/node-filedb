"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keysByCollectionGivenAdapter = void 0;
async function keysByCollectionGivenAdapter(collectionsAdapter) {
    const result = new Map();
    const collections = await collectionsAdapter.toValues();
    collections.forEach((collection) => {
        result.set(collection.collection, new Set(collection.keys));
    });
    return result;
}
exports.keysByCollectionGivenAdapter = keysByCollectionGivenAdapter;
//# sourceMappingURL=keysByCollectionGivenAdapter.js.map