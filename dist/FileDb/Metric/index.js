"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metric = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const observable_1 = require("@anderjason/observable");
const PropsObject_1 = require("../../PropsObject");
class Metric extends PropsObject_1.PropsObject {
    constructor() {
        super(...arguments);
        this.recordMetricValues = observable_1.ObservableDict.ofEmpty();
    }
    async load() {
        const portableMetric = await this.props.adapter.toOptionalValueGivenKey(this.props.metricKey);
        this.recordMetricValues.sync(portableMetric.recordMetricValues);
    }
    async save() {
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(this.props.metricKey)
            .toHashedString()
            .slice(0, 24);
        if (this.recordMetricValues.count > 0) {
            const recordMetricValues = {};
            this.recordMetricValues.toKeys().forEach((recordKey) => {
                recordMetricValues[recordKey] = this.recordMetricValues.toOptionalValueGivenKey(recordKey);
            });
            const contents = {
                metricKey: this.props.metricKey,
                recordMetricValues,
            };
            await this.props.adapter.writeValue(hash, contents);
        }
        else {
            await this.props.adapter.deleteKey(hash);
        }
    }
}
exports.Metric = Metric;
//# sourceMappingURL=index.js.map