"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.valuesByKeyByIndexGivenAdapter = void 0;
async function valuesByKeyByIndexGivenAdapter(adapter) {
    const result = new Map();
    const indexes = await adapter.toValues();
    indexes.forEach((index) => {
        const valuesByKey = new Map(Object.entries(index.valuesByKey));
        result.set(index.index, valuesByKey);
    });
    return result;
}
exports.valuesByKeyByIndexGivenAdapter = valuesByKeyByIndexGivenAdapter;
//# sourceMappingURL=valuesByKeyByIndexGivenFileDbDirectory.js.map