"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portableEntryResultGivenBuffer = void 0;
const ensureValuesExist_1 = require("./ensureValuesExist");
function portableEntryGivenVersion1(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableEntryGivenVersion1", [
        "key",
        "createdAtMs",
        "updatedAtMs",
        "data",
        "collections",
        "valuesByIndex",
    ]);
    return {
        entryKey: obj.key,
        createdAtMs: obj.createdAtMs,
        updatedAtMs: obj.updatedAtMs,
        data: obj.data,
        tagKeys: obj.collections,
        metricValues: obj.valuesByIndex,
    };
}
function portableEntryGivenVersion2(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableEntryGivenVersion2", [
        "entryKey",
        "createdAtMs",
        "updatedAtMs",
        "data",
        "tagKeys",
        "metricValues",
    ]);
    return obj;
}
function portableEntryResultGivenBuffer(buffer) {
    const obj = JSON.parse(buffer.toString());
    const version = obj.version || 1;
    switch (version) {
        case 1:
            return {
                value: portableEntryGivenVersion1(obj),
                shouldRewriteStorage: true,
            };
        case 2:
            return {
                value: portableEntryGivenVersion2(obj),
                shouldRewriteStorage: false,
            };
        default:
            throw new Error("Unsupported version in portableEntryResultGivenBuffer");
    }
}
exports.portableEntryResultGivenBuffer = portableEntryResultGivenBuffer;
//# sourceMappingURL=portableEntryResultGivenBuffer.js.map