"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAdapter = void 0;
const skytree_1 = require("skytree");
class MemoryAdapter extends skytree_1.Actor {
    constructor() {
        super(...arguments);
        this._data = new Map();
    }
    async toKeys() {
        if (this.isActive.value == false) {
            throw new Error("MemoryAdapter is not active");
        }
        return Array.from(this._data.keys());
    }
    async toValues() {
        if (this.isActive.value == false) {
            throw new Error("MemoryAdapter is not active");
        }
        return Array.from(this._data.values());
    }
    async toOptionalValue(key) {
        if (this.isActive.value == false) {
            throw new Error("MemoryAdapter is not active");
        }
        return this._data.get(key);
    }
    async setValue(key, value) {
        if (this.isActive.value == false) {
            throw new Error("MemoryAdapter is not active");
        }
        this._data.set(key, value);
    }
    async deleteKey(key) {
        if (this.isActive.value == false) {
            throw new Error("MemoryAdapter is not active");
        }
        this._data.delete(key);
    }
}
exports.MemoryAdapter = MemoryAdapter;
//# sourceMappingURL=index.js.map