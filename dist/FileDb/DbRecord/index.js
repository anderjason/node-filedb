"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbRecord = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const observable_1 = require("@anderjason/observable");
const time_1 = require("@anderjason/time");
const PropsObject_1 = require("../../PropsObject");
class DbRecord extends PropsObject_1.PropsObject {
    constructor(props) {
        super(props);
        this.tagKeys = observable_1.ObservableSet.ofEmpty();
        this.metricValues = observable_1.ObservableDict.ofEmpty();
        this.createdAt = observable_1.Observable.ofEmpty();
        this.updatedAt = observable_1.Observable.ofEmpty();
        this.recordData = observable_1.Observable.ofEmpty();
        this.recordKey = props.recordKey || node_crypto_1.UniqueId.ofRandom().toUUIDString();
        this.recordData.setValue(props.recordData);
        this.createdAt.setValue(props.createdAt || time_1.Instant.ofNow());
        this.updatedAt.setValue(props.updatedAt || props.createdAt || time_1.Instant.ofNow());
        if (this.props.tagKeys != null) {
            this.tagKeys.sync(this.props.tagKeys);
        }
        if (this.props.metricValues != null) {
            this.metricValues.sync(this.props.metricValues);
        }
    }
}
exports.DbRecord = DbRecord;
//# sourceMappingURL=index.js.map