"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portableMetricResultGivenBuffer = void 0;
const ensureValuesExist_1 = require("./ensureValuesExist");
function portableMetricGivenVersion3(obj) {
    ensureValuesExist_1.ensureValuesExist(obj, "portableMetricGivenVersion3", [
        "key",
        "entryMetricValues",
    ]);
    return {
        metricKey: obj.key,
        entryMetricValues: obj.entryMetricValues,
    };
}
function portableMetricResultGivenBuffer(buffer) {
    const obj = JSON.parse(buffer.toString());
    const version = obj.version || 1;
    switch (version) {
        case 3:
            return {
                value: portableMetricGivenVersion3(obj),
                shouldRewriteStorage: false,
            };
        default:
            throw new Error("Unsupported version in portableMetricResultGivenBuffer");
    }
}
exports.portableMetricResultGivenBuffer = portableMetricResultGivenBuffer;
//# sourceMappingURL=portableMetricResultGivenBuffer.js.map