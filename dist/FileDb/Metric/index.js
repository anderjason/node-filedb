"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metric = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const observable_1 = require("@anderjason/observable");
const PropsObject_1 = require("../../PropsObject");
class Metric extends PropsObject_1.PropsObject {
    constructor() {
        super(...arguments);
        this.entryMetricValues = observable_1.ObservableDict.ofEmpty();
    }
    async load() {
        const portableMetric = await this.props.adapter.toOptionalValueGivenKey(this.props.metricKey);
        this.entryMetricValues.sync(portableMetric.entryMetricValues);
    }
    async save() {
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(this.props.metricKey)
            .toHashedString()
            .slice(0, 24);
        if (this.entryMetricValues.count > 0) {
            const entryMetricValues = {};
            this.entryMetricValues.toKeys().forEach((entryKey) => {
                entryMetricValues[entryKey] = this.entryMetricValues.toOptionalValueGivenKey(entryKey);
            });
            const contents = {
                metricKey: this.props.metricKey,
                entryMetricValues,
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