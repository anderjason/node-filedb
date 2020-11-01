"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAdapter = void 0;
class MemoryAdapter {
    constructor() {
        this._data = new Map();
    }
    async toKeys() {
        return Array.from(this._data.keys());
    }
    async toValues() {
        return Array.from(this._data.values());
    }
    async toOptionalValue(key) {
        return this._data.get(key);
    }
    async setValue(key, value) {
        this._data.set(key, value);
    }
    async deleteKey(key) {
        this._data.delete(key);
    }
}
exports.MemoryAdapter = MemoryAdapter;
//# sourceMappingURL=index.js.map