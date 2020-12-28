"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portableTagResultGivenBuffer = void 0;
const ensureValuesExist_1 = require("./ensureValuesExist");
function portableTagGivenVersion1(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableTagGivenVersion1", ["collection", "keys"]);
    return {
        tagKey: obj.collection,
        entryKeys: obj.keys,
    };
}
function portableTagGivenVersion2(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableTagGivenVersion2", ["tagKey", "entryKeys"]);
    return {
        tagKey: obj.collection,
        entryKeys: obj.keys,
    };
}
function portableTagResultGivenBuffer(buffer) {
    const obj = JSON.parse(buffer.toString());
    const version = obj.version || 1;
    switch (version) {
        case 1:
            return {
                value: portableTagGivenVersion1(obj),
                shouldRewriteStorage: true,
            };
        case 2:
            return {
                value: portableTagGivenVersion2(obj),
                shouldRewriteStorage: false,
            };
        default:
            throw new Error("Unsupported version in portableTagResultGivenBuffer");
    }
}
exports.portableTagResultGivenBuffer = portableTagResultGivenBuffer;
//# sourceMappingURL=portableTagResultGivenBuffer.js.map