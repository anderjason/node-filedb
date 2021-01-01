"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferGivenPortableTag = void 0;
function bufferGivenPortableTag(value) {
    const obj = Object.assign({ version: 3, key: value.tagKey }, value);
    return Buffer.from(JSON.stringify(obj));
}
exports.bufferGivenPortableTag = bufferGivenPortableTag;
//# sourceMappingURL=bufferGivenPortableTag.js.map