"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portableTagResultGivenBuffer = void 0;
const ensureValuesExist_1 = require("./ensureValuesExist");
function portableTagGivenVersion3(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableTagGivenVersion3", ["key", "entryKeys"]);
    return {
        key: obj.key,
        entryKeys: obj.entryKeys,
    };
}
function portableTagResultGivenBuffer(buffer) {
    const obj = JSON.parse(buffer.toString());
    const version = obj.version || 1;
    switch (version) {
        case 3:
            return {
                value: portableTagGivenVersion3(obj),
                shouldRewriteStorage: false,
            };
        default:
            throw new Error("Unsupported version in portableTagResultGivenBuffer");
    }
}
exports.portableTagResultGivenBuffer = portableTagResultGivenBuffer;
//# sourceMappingURL=portableTagResultGivenBuffer.js.map