"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portableEntryResultGivenBuffer = void 0;
const ensureValuesExist_1 = require("./ensureValuesExist");
function portableEntryGivenVersion3(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableEntryGivenVersion3", [
        "key",
        "createdAtMs",
        "updatedAtMs",
        "data",
        "tagKeys",
        "metricValues",
    ]);
    return {
        key: obj.key,
        createdAtMs: obj.createdAtMs,
        updatedAtMs: obj.updatedAtMs,
        data: obj.data,
        tagKeys: obj.tagKeys,
        metricValues: obj.metricValues,
    };
}
function portableEntryResultGivenBuffer(buffer) {
    const obj = JSON.parse(buffer.toString());
    const version = obj.version || 1;
    switch (version) {
        case 3:
            return {
                value: portableEntryGivenVersion3(obj),
                shouldRewriteStorage: false,
            };
        default:
            throw new Error("Unsupported version in portableEntryResultGivenBuffer");
    }
}
exports.portableEntryResultGivenBuffer = portableEntryResultGivenBuffer;
//# sourceMappingURL=portableEntryResultGivenBuffer.js.map