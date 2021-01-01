"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metric = void 0;
const observable_1 = require("@anderjason/observable");
const PropsObject_1 = require("../PropsObject");
class Metric extends PropsObject_1.PropsObject {
    constructor(props) {
        super(props);
        this.entryMetricValues = observable_1.ObservableDict.ofEmpty();
        if (props.metricKey == null) {
            throw new Error("metricKey is required");
        }
        if (props.adapter == null) {
            throw new Error("adapter is required");
        }
        this.metricKey = props.metricKey;
    }
    async load() {
        const portableMetric = await this.props.adapter.toOptionalValueGivenKey(this.props.metricKey);
        if (portableMetric == null) {
            throw new Error(`Metrics adapter returned null for metricKey '${this.props.metricKey}'`);
        }
        this.entryMetricValues.sync(portableMetric.entryMetricValues);
    }
    async save() {
        if (this.entryMetricValues.count > 0) {
            const entryMetricValues = {};
            this.entryMetricValues.toKeys().forEach((entryKey) => {
                entryMetricValues[entryKey] = this.entryMetricValues.toOptionalValueGivenKey(entryKey);
            });
            const contents = {
                metricKey: this.props.metricKey,
                entryMetricValues,
            };
            await this.props.adapter.writeValue(this.props.metricKey, contents);
        }
        else {
            await this.props.adapter.deleteKey(this.props.metricKey);
        }
    }
    toObject() {
        return {
            metricKey: this.metricKey,
            entryMetricValues: this.entryMetricValues.toValues(),
        };
    }
}
exports.Metric = Metric;
//# sourceMappingURL=index.js.map