"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entry = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const time_1 = require("@anderjason/time");
const PropsObject_1 = require("../PropsObject");
class Entry extends PropsObject_1.PropsObject {
    constructor(props) {
        super(props);
        this.key = props.key || node_crypto_1.UniqueId.ofRandom().toUUIDString();
        this.data = props.data;
        this.createdAt = props.createdAt || time_1.Instant.ofNow();
        this.updatedAt = props.updatedAt || props.createdAt || time_1.Instant.ofNow();
        this.tagKeys = props.tagKeys || [];
        this.metricValues = props.metricValues || {};
    }
    static givenPortableObject(obj) {
        return new Entry({
            key: obj.key,
            createdAt: time_1.Instant.givenEpochMilliseconds(obj.createdAtMs),
            updatedAt: time_1.Instant.givenEpochMilliseconds(obj.updatedAtMs),
            data: obj.data,
            tagKeys: obj.tagKeys,
            metricValues: obj.metricValues,
        });
    }
    toPortableObject() {
        return {
            key: this.key,
            tagKeys: this.tagKeys || [],
            metricValues: this.metricValues || {},
            createdAtMs: this.createdAt.toEpochMilliseconds(),
            updatedAtMs: this.updatedAt.toEpochMilliseconds(),
            data: this.data,
        };
    }
}
exports.Entry = Entry;
//# sourceMappingURL=index.js.map