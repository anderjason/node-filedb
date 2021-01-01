"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferGivenPortableEntry = void 0;
function bufferGivenPortableEntry(value) {
    const obj = Object.assign({ version: 3, key: value.entryKey }, value);
    return Buffer.from(JSON.stringify(obj, null, 2));
}
exports.bufferGivenPortableEntry = bufferGivenPortableEntry;
//# sourceMappingURL=bufferGivenPortableEntry.js.map