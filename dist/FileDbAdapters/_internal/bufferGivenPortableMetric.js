"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferGivenPortableMetric = void 0;
function bufferGivenPortableMetric(value) {
    const obj = Object.assign({ version: 3, key: value.metricKey }, value);
    delete obj.metricKey;
    return Buffer.from(JSON.stringify(obj));
}
exports.bufferGivenPortableMetric = bufferGivenPortableMetric;
//# sourceMappingURL=bufferGivenPortableMetric.js.map