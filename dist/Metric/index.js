"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metric = void 0;
const PropsObject_1 = require("../PropsObject");
class Metric extends PropsObject_1.PropsObject {
    constructor(props) {
        super(props);
        this.entryMetricValues = {};
        if (props.metricKey == null) {
            throw new Error("metricKey is required");
        }
        if (props.adapter == null) {
            throw new Error("adapter is required");
        }
        this.key = props.metricKey;
    }
    toOptionalValueGivenEntryKey(entryKey) {
        if (this.entryMetricValues == null) {
            return undefined;
        }
        return this.entryMetricValues[entryKey];
    }
    setEntryMetricValue(entryKey, value) {
        if (this.entryMetricValues == null) {
            this.entryMetricValues = {};
        }
        this.entryMetricValues[entryKey] = value;
    }
    hasValueGivenEntryKey(entryKey) {
        return this.toOptionalValueGivenEntryKey(entryKey) != null;
    }
    removeValueGivenEntryKey(metricKey) {
        if (this.entryMetricValues == null) {
            return;
        }
        delete this.entryMetricValues[metricKey];
    }
    async load() {
        const portableMetric = await this.props.adapter.toOptionalValueGivenKey(this.props.metricKey);
        if (portableMetric == null) {
            throw new Error(`Metrics adapter returned null for metricKey '${this.props.metricKey}'`);
        }
        this.entryMetricValues = portableMetric.entryMetricValues || {};
    }
    async save() {
        if (this.entryMetricValues.count > 0) {
            await this.props.adapter.writeValue(this.props.metricKey, this.toPortableObject());
        }
        else {
            await this.props.adapter.deleteKey(this.props.metricKey);
        }
    }
    toPortableObject() {
        return {
            key: this.key,
            entryMetricValues: this.entryMetricValues || {},
        };
    }
}
exports.Metric = Metric;
//# sourceMappingURL=index.js.map