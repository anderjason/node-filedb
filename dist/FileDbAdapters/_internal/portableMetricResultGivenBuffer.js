"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portableMetricResultGivenBuffer = void 0;
const ensureValuesExist_1 = require("./ensureValuesExist");
function portableMetricGivenVersion1(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableMetricGivenVersion1", [
        "index",
        "valuesByKey",
    ]);
    return {
        metricKey: obj.index,
        entryMetricValues: obj.valuesByKey,
    };
}
function portableMetricGivenVersion2(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableMetricGivenVersion2", [
        "metricKey",
        "entryMetricValues",
    ]);
    return obj;
}
function portableMetricResultGivenBuffer(buffer) {
    const obj = JSON.parse(buffer.toString());
    const version = obj.version || 1;
    switch (version) {
        case 1:
            return {
                value: portableMetricGivenVersion1(obj),
                shouldRewriteStorage: true,
            };
        case 2:
            return {
                value: portableMetricGivenVersion2(obj),
                shouldRewriteStorage: false,
            };
        default:
            throw new Error("Unsupported version in portableMetricResultGivenBuffer");
    }
}
exports.portableMetricResultGivenBuffer = portableMetricResultGivenBuffer;
//# sourceMappingURL=portableMetricResultGivenBuffer.js.map