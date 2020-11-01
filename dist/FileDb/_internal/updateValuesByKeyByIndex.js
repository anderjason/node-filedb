"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateValuesByKeyByIndex = void 0;
async function updateValuesByKeyByIndex(adapter, indexKey, valuesByKey) {
    if (valuesByKey != null && valuesByKey.size > 0) {
        const obj = {};
        for (let [key, value] of valuesByKey) {
            obj[key] = value;
        }
        const contents = {
            index: indexKey,
            valuesByKey: obj,
        };
        await adapter.setValue(indexKey, contents);
    }
    else {
        await adapter.deleteKey(indexKey);
    }
}
exports.updateValuesByKeyByIndex = updateValuesByKeyByIndex;
//# sourceMappingURL=updateValuesByKeyByIndex.js.map