"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDb = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const skytree_1 = require("skytree");
const time_1 = require("@anderjason/time");
const util_1 = require("@anderjason/util");
const LRUCache_1 = require("../LRUCache");
const Metric_1 = require("../Metric");
const Tag_1 = require("../Tag");
const Entry_1 = require("../Entry");
const observable_1 = require("@anderjason/observable");
class FileDb extends skytree_1.Actor {
    constructor(props) {
        super(props);
        this._isReady = observable_1.Observable.givenValue(false, observable_1.Observable.isStrictEqual);
        this.isReady = observable_1.ReadOnlyObservable.givenObservable(this._isReady);
        this._tagPrefixes = observable_1.ObservableSet.ofEmpty();
        this._tags = observable_1.ObservableDict.ofEmpty();
        this._metrics = observable_1.ObservableDict.ofEmpty();
        this._allEntryKeys = observable_1.Observable.ofEmpty();
        this._instructions = [];
        this._deleteEntry = async (entryKey) => {
            if (entryKey.length < 5) {
                throw new Error("Entry key length must be at least 5 characters");
            }
            this._entryCache.remove(entryKey);
            const existingRecord = await this.toOptionalEntryGivenKey(entryKey);
            if (existingRecord == null) {
                return;
            }
            if (this._isReady.value == false) {
                await this.ensureReady();
            }
            const changedTags = new Set();
            const changedMetrics = new Set();
            existingRecord.tagKeys.toArray().forEach((tagKey) => {
                const tag = this._tags.toOptionalValueGivenKey(tagKey);
                if (tag != null && tag.entryKeys.hasValue(entryKey)) {
                    tag.entryKeys.removeValue(entryKey);
                    changedTags.add(tag);
                }
            });
            const metricKeys = existingRecord.metricValues.toKeys();
            metricKeys.forEach((metricKey) => {
                const metric = this._metrics.toOptionalValueGivenKey(metricKey);
                if (metric != null && metric.entryMetricValues.hasKey(entryKey)) {
                    metric.entryMetricValues.removeKey(entryKey);
                    changedMetrics.add(metric);
                }
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedTags), async (tag) => {
                await tag.save();
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedMetrics), async (metric) => {
                await metric.save();
            });
            await this.props.adapters.props.entriesAdapter.deleteKey(entryKey);
        };
        this._readEntry = async (entryKey) => {
            if (entryKey == null) {
                throw new Error("Entry key is required");
            }
            if (entryKey.length < 5) {
                throw new Error("Entry key length must be at least 5 characters");
            }
            const cachedEntry = this._entryCache.get(entryKey);
            if (cachedEntry != null) {
                return cachedEntry;
            }
            if (this._isReady.value == false) {
                await this.ensureReady();
            }
            let portableEntry = await this.props.adapters.props.entriesAdapter.toOptionalValueGivenKey(entryKey);
            if (portableEntry == null) {
                return undefined;
            }
            const result = new Entry_1.Entry({
                entryKey: portableEntry.entryKey,
                createdAt: time_1.Instant.givenEpochMilliseconds(portableEntry.createdAtMs),
                updatedAt: time_1.Instant.givenEpochMilliseconds(portableEntry.updatedAtMs),
                data: portableEntry.data,
                tagKeys: new Set(portableEntry.tagKeys),
                metricValues: portableEntry.metricValues || {},
            });
            this._entryCache.put(entryKey, result);
            return result;
        };
        this._writeEntry = async (entryData, time, entryKey) => {
            if (entryKey == null) {
                entryKey = node_crypto_1.UniqueId.ofRandom().toUUIDString();
            }
            if (entryKey.length < 5) {
                throw new Error("Entry key length must be at least 5 characters");
            }
            if (this._isReady.value == false) {
                await this.ensureReady();
            }
            let entry = await this._readEntry(entryKey);
            const tagKeys = this.props.tagKeysGivenEntryData(entryData);
            const metricValues = this.props.metricsGivenEntryData(entryData);
            if (entry == null) {
                entry = new Entry_1.Entry({
                    entryKey: entryKey,
                    createdAt: time,
                    updatedAt: time,
                    data: entryData,
                    tagKeys,
                    metricValues,
                });
            }
            else {
                entry.updatedAt.setValue(time);
                entry.tagKeys.sync(tagKeys);
                entry.metricValues.sync(metricValues);
                entry.data.setValue(entryData);
            }
            this._entryCache.put(entryKey, entry);
            const portableEntry = {
                entryKey: entry.entryKey,
                createdAtMs: entry.createdAt.value.toEpochMilliseconds(),
                updatedAtMs: entry.updatedAt.value.toEpochMilliseconds(),
                data: entry.data.value,
            };
            if (entry.tagKeys != null && entry.tagKeys.count > 0) {
                portableEntry.tagKeys = entry.tagKeys.toArray();
            }
            if (entry.metricValues == null) {
                entry.metricValues.clear();
            }
            entry.metricValues.setValue("createdAt", entry.createdAt.value.toEpochMilliseconds());
            portableEntry.metricValues = entry.metricValues.toValues();
            const changedTags = new Set();
            const changedMetrics = new Set();
            entry.tagKeys.toArray().forEach((tagKey) => {
                let tag = this._tags.toOptionalValueGivenKey(tagKey);
                if (tag == null) {
                    tag = new Tag_1.Tag({
                        tagKey,
                        adapter: this.props.adapters.props.tagsAdapter,
                    });
                    this._tags.setValue(tagKey, tag);
                }
                if (!tag.entryKeys.hasValue(entryKey)) {
                    tag.entryKeys.addValue(entryKey);
                    changedTags.add(tag);
                }
            });
            const metricKeys = entry.metricValues.toKeys();
            metricKeys.forEach((metricKey) => {
                let metric = this._metrics.toOptionalValueGivenKey(metricKey);
                if (metric == null) {
                    metric = new Metric_1.Metric({
                        metricKey,
                        adapter: this.props.adapters.props.metricsAdapter,
                    });
                    this._metrics.setValue(metricKey, metric);
                }
                const metricValue = entry.metricValues.toOptionalValueGivenKey(metricKey);
                if (metric.entryMetricValues.toOptionalValueGivenKey(entryKey) !==
                    metricValue) {
                    metric.entryMetricValues.setValue(entryKey, metricValue);
                    changedMetrics.add(metric);
                }
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedTags), async (tag) => {
                await tag.save();
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedMetrics), async (metric) => {
                await metric.save();
            });
            await this.props.adapters.props.entriesAdapter.writeValue(entryKey, portableEntry);
            return entry;
        };
        this._listRecordKeys = async (options = {}) => {
            let entryKeys;
            if (this._isReady.value == false) {
                await this.ensureReady();
            }
            if (options.requireTagKeys == null || options.requireTagKeys.length === 0) {
                entryKeys = this._allEntryKeys.value;
            }
            else {
                const sets = options.requireTagKeys.map((tagKey) => {
                    const tag = this._tags.toOptionalValueGivenKey(tagKey);
                    if (tag == null) {
                        return new Set();
                    }
                    return tag.entryKeys.toSet();
                });
                entryKeys = Array.from(util_1.SetUtil.intersectionGivenSets(sets));
            }
            const metricKey = options.orderByMetricKey;
            if (metricKey != null) {
                const metric = this._metrics.toOptionalValueGivenKey(metricKey);
                if (metric == null) {
                    throw new Error(`Metric is not defined '${metricKey}'`);
                }
                entryKeys = util_1.ArrayUtil.arrayWithOrderFromValue(entryKeys, (entryKey) => {
                    const metricValue = metric.entryMetricValues.toOptionalValueGivenKey(entryKey);
                    return metricValue || 0;
                }, "ascending");
            }
            let start = 0;
            let end = entryKeys.length;
            if (options.offset != null) {
                start = parseInt(options.offset, 10);
            }
            if (options.limit != null) {
                end = Math.min(end, start + parseInt(options.limit, 10));
            }
            return entryKeys.slice(start, end);
        };
        this._listRecords = async (options = {}) => {
            const entryKeys = await this._listRecordKeys(options);
            const entries = [];
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(entryKeys, async (entryKey) => {
                const result = await this._readEntry(entryKey);
                if (result != null) {
                    entries.push(result);
                }
            });
            return entries;
        };
        this._nextInstruction = async () => {
            const instruction = this._instructions.shift();
            if (instruction == null) {
                return;
            }
            try {
                switch (instruction.type) {
                    case "write":
                        const writeResult = await this._writeEntry(instruction.data, instruction.time, instruction.key);
                        instruction.resolve(writeResult);
                        break;
                    case "read":
                        const readResult = await this._readEntry(instruction.key);
                        instruction.resolve(readResult);
                        break;
                    case "delete":
                        await this._deleteEntry(instruction.key);
                        instruction.resolve();
                        break;
                    case "listEntryKeys":
                        const listKeysResult = await this._listRecordKeys(instruction.options);
                        instruction.resolve(listKeysResult);
                        break;
                    case "listEntries":
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
        this.adapters = props.adapters;
        this._entryCache = new LRUCache_1.LRUCache(props.cacheSize || 10);
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
    get tagPrefixes() {
        return this._tagPrefixes.toArray();
    }
    async load() {
        if (this.isActive.value == false) {
            return;
        }
        const entriesAdapter = this.props.adapters.props.entriesAdapter;
        const tagsAdapter = this.props.adapters.props.tagsAdapter;
        const metricsAdapter = this.props.adapters.props.metricsAdapter;
        const entryKeys = await entriesAdapter.toKeys();
        const tagKeys = await tagsAdapter.toKeys();
        const metricKeys = await metricsAdapter.toKeys();
        await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(tagKeys, async (tagKey) => {
            const tag = new Tag_1.Tag({
                tagKey,
                adapter: tagsAdapter,
            });
            await tag.load();
            this._tags.setValue(tagKey, tag);
            this._tagPrefixes.addValue(tag.tagPrefix);
        });
        await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(metricKeys, async (metricKey) => {
            const metric = new Metric_1.Metric({
                metricKey,
                adapter: metricsAdapter,
            });
            await metric.load();
            this._metrics.setValue(metricKey, metric);
        });
        this._allEntryKeys.setValue(entryKeys);
        this._isReady.setValue(true);
    }
    async toEntryKeys(options = {}) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "listEntryKeys",
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
    async hasEntry(entryKey) {
        const keys = await this.toEntryKeys();
        return keys.includes(entryKey);
    }
    async toEntryCount(requireTagKeys) {
        const keys = await this.toEntryKeys({
            requireTagKeys: requireTagKeys,
        });
        return keys.length;
    }
    async toEntries(options = {}) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "listEntries",
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
    async toOptionalFirstEntry(options = {}) {
        const results = await this.toEntries(Object.assign(Object.assign({}, options), { limit: 1 }));
        return results[0];
    }
    async toEntryGivenKey(entryKey) {
        const result = await this.toOptionalEntryGivenKey(entryKey);
        if (result == null) {
            throw new Error(`Entry not found for key '${entryKey}'`);
        }
        return result;
    }
    toOptionalEntryGivenKey(entryKey) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "read",
                key: entryKey,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    writeEntry(entryData, entryKey) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "write",
                time: time_1.Instant.ofNow(),
                key: entryKey,
                data: entryData,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    deleteEntryKey(entryKey) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "delete",
                key: entryKey,
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