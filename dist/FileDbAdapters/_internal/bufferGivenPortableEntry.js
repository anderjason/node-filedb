"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferGivenPortableEntry = void 0;
function bufferGivenPortableEntry(value) {
    const obj = Object.assign({ version: 3, key: value.entryKey }, value);
    delete obj.entryKey;
    return Buffer.from(JSON.stringify(obj));
}
exports.bufferGivenPortableEntry = bufferGivenPortableEntry;
//# sourceMappingURL=bufferGivenPortableEntry.js.map