"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDb = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const skytree_1 = require("skytree");
const time_1 = require("@anderjason/time");
const util_1 = require("@anderjason/util");
const LRUCache_1 = require("../LRUCache");
const Metric_1 = require("./Metric");
const Tag_1 = require("./Tag");
const observable_1 = require("@anderjason/observable");
const DbRecord_1 = require("./DbRecord");
class FileDb extends skytree_1.Actor {
    constructor(props) {
        super(props);
        this._isReady = observable_1.Observable.givenValue(false, observable_1.Observable.isStrictEqual);
        this.isReady = observable_1.ReadOnlyObservable.givenObservable(this._isReady);
        this._tags = observable_1.ObservableDict.ofEmpty();
        this._metrics = observable_1.ObservableDict.ofEmpty();
        this._allRecordKeys = observable_1.Observable.ofEmpty();
        this._instructions = [];
        this._deleteRecord = async (recordKey) => {
            if (recordKey.length < 5) {
                throw new Error("Record key length must be at least 5 characters");
            }
            this._recordCache.remove(recordKey);
            const existingRecord = await this.toOptionalRecordGivenKey(recordKey);
            if (existingRecord == null) {
                return;
            }
            await this.ensureReady();
            const changedTags = new Set();
            const changedMetrics = new Set();
            existingRecord.tagKeys.toArray().forEach((tagKey) => {
                const tag = this._tags.toOptionalValueGivenKey(tagKey);
                if (tag != null && tag.recordKeys.hasValue(recordKey)) {
                    tag.recordKeys.removeValue(recordKey);
                    changedTags.add(tag);
                }
            });
            const metricKeys = existingRecord.metricValues.toKeys();
            metricKeys.forEach((metricKey) => {
                const metric = this._metrics.toOptionalValueGivenKey(metricKey);
                if (metric != null && metric.recordMetricValues.hasKey(recordKey)) {
                    metric.recordMetricValues.removeKey(recordKey);
                    changedMetrics.add(metric);
                }
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedTags), async (tag) => {
                await tag.save();
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedMetrics), async (metric) => {
                await metric.save();
            });
            await this.props.adapters.props.recordsAdapter.deleteKey(recordKey);
        };
        this._readRecord = async (recordKey) => {
            if (recordKey == null) {
                throw new Error("Record key is required");
            }
            if (recordKey.length < 5) {
                throw new Error("Record key length must be at least 5 characters");
            }
            const cachedRecord = this._recordCache.get(recordKey);
            if (cachedRecord != null) {
                return cachedRecord;
            }
            await this.ensureReady();
            let portableRecord = await this.props.adapters.props.recordsAdapter.toOptionalValueGivenKey(recordKey);
            if (portableRecord == null) {
                return undefined;
            }
            const result = new DbRecord_1.DbRecord({
                recordKey: portableRecord.recordKey,
                createdAt: time_1.Instant.givenEpochMilliseconds(portableRecord.createdAtMs),
                updatedAt: time_1.Instant.givenEpochMilliseconds(portableRecord.updatedAtMs),
                recordData: portableRecord.data,
                tagKeys: new Set(portableRecord.tagKeys),
                metricValues: portableRecord.metricValues || {},
            });
            this._recordCache.put(recordKey, result);
            return result;
        };
        this._writeRecord = async (recordData, time, recordKey) => {
            if (recordKey == null) {
                recordKey = node_crypto_1.UniqueId.ofRandom().toUUIDString();
            }
            if (recordKey.length < 5) {
                throw new Error("Record key length must be at least 5 characters");
            }
            await this.ensureReady();
            let record = await this._readRecord(recordKey);
            const tagKeys = this.props.tagKeysGivenRecordData(recordData);
            const metricValues = this.props.metricsGivenRecordData(recordData);
            if (record == null) {
                record = new DbRecord_1.DbRecord({
                    recordKey,
                    createdAt: time,
                    updatedAt: time,
                    recordData,
                    tagKeys,
                    metricValues,
                });
            }
            else {
                record.updatedAt.setValue(time);
                record.tagKeys.sync(tagKeys);
                record.metricValues.sync(metricValues);
                record.recordData.setValue(recordData);
            }
            this._recordCache.put(recordKey, record);
            const portableRecord = {
                recordKey: record.recordKey,
                createdAtMs: record.createdAt.value.toEpochMilliseconds(),
                updatedAtMs: record.updatedAt.value.toEpochMilliseconds(),
                data: record.recordData,
            };
            if (record.tagKeys != null && record.tagKeys.count > 0) {
                portableRecord.tagKeys = record.tagKeys.toArray();
            }
            if (record.metricValues == null) {
                record.metricValues.clear();
            }
            record.metricValues.setValue("createdAt", record.createdAt.value.toEpochMilliseconds());
            portableRecord.metricValues = record.metricValues.toValues();
            const changedTags = new Set();
            const changedMetrics = new Set();
            record.tagKeys.toArray().forEach((tagKey) => {
                let tag = this._tags.toOptionalValueGivenKey(tagKey);
                if (tag == null) {
                    tag = new Tag_1.Tag({
                        tagKey,
                        adapter: this.props.adapters.props.tagsAdapter,
                    });
                    this._tags.setValue(tagKey, tag);
                }
                if (!tag.recordKeys.hasValue(recordKey)) {
                    tag.recordKeys.addValue(recordKey);
                    changedTags.add(tag);
                }
            });
            const metricKeys = record.metricValues.toKeys();
            metricKeys.forEach((metricKey) => {
                let metric = this._metrics.toOptionalValueGivenKey(metricKey);
                if (metric == null) {
                    metric = new Metric_1.Metric({
                        metricKey,
                        adapter: this.props.adapters.props.metricsAdapter,
                    });
                    this._metrics.setValue(metricKey, metric);
                }
                const metricValue = record.metricValues.toOptionalValueGivenKey(metricKey);
                if (metric.recordMetricValues.toOptionalValueGivenKey(recordKey) !==
                    metricValue) {
                    metric.recordMetricValues.setValue(recordKey, metricValue);
                    changedMetrics.add(metric);
                }
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedTags), async (tag) => {
                await tag.save();
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedMetrics), async (metric) => {
                await metric.save();
            });
            await this.props.adapters.props.recordsAdapter.writeValue(recordKey, portableRecord);
            return record;
        };
        this._listRecordKeys = async (options = {}) => {
            let recordKeys;
            await this.ensureReady();
            if (options.requireTagKeys == null || options.requireTagKeys.length === 0) {
                recordKeys = this._allRecordKeys.value;
            }
            else {
                const sets = options.requireTagKeys.map((tagKey) => {
                    const tag = this._tags.toOptionalValueGivenKey(tagKey);
                    if (tag == null) {
                        return new Set();
                    }
                    return tag.recordKeys.toSet();
                });
                recordKeys = Array.from(util_1.SetUtil.intersectionGivenSets(sets));
            }
            const metricKey = options.orderByMetricKey;
            if (metricKey != null) {
                const metric = this._metrics.toOptionalValueGivenKey(metricKey);
                if (metric == null) {
                    throw new Error(`Metric is not defined '${metricKey}'`);
                }
                recordKeys = util_1.ArrayUtil.arrayWithOrderFromValue(recordKeys, (recordKey) => {
                    const metricValue = metric.recordMetricValues.toOptionalValueGivenKey(recordKey);
                    return metricValue || 0;
                }, "ascending");
            }
            let start = 0;
            let end = recordKeys.length;
            if (options.offset != null) {
                start = parseInt(options.offset, 10);
            }
            if (options.limit != null) {
                end = Math.min(end, start + parseInt(options.limit, 10));
            }
            return recordKeys.slice(start, end);
        };
        this._listRecords = async (options = {}) => {
            const recordKeys = await this._listRecordKeys(options);
            const records = [];
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(recordKeys, async (recordKey) => {
                const result = await this._readRecord(recordKey);
                if (result != null) {
                    records.push(result);
                }
            });
            return records;
        };
        this._nextInstruction = async () => {
            const instruction = this._instructions.shift();
            if (instruction == null) {
                return;
            }
            try {
                switch (instruction.type) {
                    case "write":
                        const writeResult = await this._writeRecord(instruction.data, instruction.time, instruction.key);
                        instruction.resolve(writeResult);
                        break;
                    case "read":
                        const readResult = await this._readRecord(instruction.key);
                        instruction.resolve(readResult);
                        break;
                    case "delete":
                        await this._deleteRecord(instruction.key);
                        instruction.resolve();
                        break;
                    case "listRecordKeys":
                        const listKeysResult = await this._listRecordKeys(instruction.options);
                        instruction.resolve(listKeysResult);
                        break;
                    case "listRecords":
                        const listRowsResult = await this._listRecords(instruction.options);
                        instruction.resolve(listRowsResult);
                        break;
                }
            }
            catch (err) {
                instruction.reject(err);
            }
            if (this._instructions.length > 0) {
                setTimeout(this._nextInstruction, 1);
            }
        };
        this._recordCache = new LRUCache_1.LRUCache(props.cacheSize || 10);
    }
    onActivate() {
        this.addActor(this.props.adapters);
        this.load();
    }
    get tags() {
        return Object.values(this._tags.toValues());
    }
    get metrics() {
        return Object.values(this._metrics.toValues());
    }
    async load() {
        if (this.isActive.value == false) {
            return;
        }
        const recordsAdapter = this.props.adapters.props.recordsAdapter;
        const tagsAdapter = this.props.adapters.props.tagsAdapter;
        const metricsAdapter = this.props.adapters.props.metricsAdapter;
        const recordKeys = await recordsAdapter.toKeys();
        const tagKeys = await tagsAdapter.toKeys();
        const metricKeys = await metricsAdapter.toKeys();
        this._allRecordKeys.setValue(recordKeys);
        await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(tagKeys, async (tagKey) => {
            const tag = new Tag_1.Tag({
                tagKey,
                adapter: tagsAdapter,
            });
            await tag.load();
            this._tags.setValue(tagKey, tag);
        });
        await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(metricKeys, async (metricKey) => {
            const metric = new Metric_1.Metric({
                metricKey,
                adapter: metricsAdapter,
            });
            await metric.load();
            this._metrics.setValue(metricKey, metric);
        });
        this._isReady.setValue(true);
    }
    async toRecordKeys(options = {}) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "listRecordKeys",
                options,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    async hasRecord(recordKey) {
        const keys = await this.toRecordKeys();
        return keys.includes(recordKey);
    }
    async toRecordCount(requireTagKeys) {
        const keys = await this.toRecordKeys({
            requireTagKeys: requireTagKeys,
        });
        return keys.length;
    }
    async toRecords(options = {}) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "listRecords",
                options,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    async toOptionalFirstRecord(options = {}) {
        const results = await this.toRecords(Object.assign(Object.assign({}, options), { limit: 1 }));
        return results[0];
    }
    async toRecordGivenKey(recordKey) {
        const result = await this.toOptionalRecordGivenKey(recordKey);
        if (result == null) {
            throw new Error(`Record not found for key '${recordKey}'`);
        }
        return result;
    }
    toOptionalRecordGivenKey(recordKey) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "read",
                key: recordKey,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    writeRecord(recordData, recordKey) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "write",
                time: time_1.Instant.ofNow(),
                key: recordKey,
                data: recordData,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    deleteKey(recordKey) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "delete",
                key: recordKey,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    async ensureReady() {
        await this._isReady.toPromise((v) => v == true);
    }
}
exports.FileDb = FileDb;
//# sourceMappingURL=index.js.map