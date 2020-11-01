"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateValuesByKeyByIndex = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
async function updateValuesByKeyByIndex(adapter, indexKey, valuesByKey) {
    const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(indexKey)
        .toHashedString()
        .slice(0, 24);
    if (valuesByKey != null && valuesByKey.size > 0) {
        const obj = {};
        for (let [key, value] of valuesByKey) {
            obj[key] = value;
        }
        const contents = {
            index: indexKey,
            valuesByKey: obj,
        };
        await adapter.setValue(hash, contents);
    }
    else {
        await adapter.deleteKey(hash);
    }
}
exports.updateValuesByKeyByIndex = updateValuesByKeyByIndex;
//# sourceMappingURL=updateValuesByKeyByIndex.js.map