"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDb = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const skytree_1 = require("skytree");
const time_1 = require("@anderjason/time");
const util_1 = require("@anderjason/util");
const LRUCache_1 = require("../LRUCache");
const keysByCollectionGivenAdapter_1 = require("./_internal/keysByCollectionGivenAdapter");
const valuesByKeyByIndexGivenFileDbDirectory_1 = require("./_internal/valuesByKeyByIndexGivenFileDbDirectory");
const updateKeysByCollection_1 = require("./_internal/updateKeysByCollection");
const updateValuesByKeyByIndex_1 = require("./_internal/updateValuesByKeyByIndex");
const observable_1 = require("@anderjason/observable");
const asyncGivenObservable_1 = require("../asyncGivenObservable");
class FileDb extends skytree_1.Actor {
    constructor(props) {
        super(props);
        this._isReady = observable_1.Observable.givenValue(false, observable_1.Observable.isStrictEqual);
        this.isReady = observable_1.ReadOnlyObservable.givenObservable(this._isReady);
        this._keysByCollection = observable_1.Observable.ofEmpty();
        this._valuesByKeyByIndex = observable_1.Observable.ofEmpty();
        this._allKeys = observable_1.Observable.ofEmpty();
        this._instructions = [];
        this._delete = async (rowKey) => {
            if (rowKey.length < 5) {
                throw new Error("Key length must be at least 5 characters");
            }
            this._rowCache.remove(rowKey);
            const existingRow = await this.toOptionalRowGivenKey(rowKey);
            if (existingRow == null) {
                return;
            }
            const changedCollections = new Set();
            const changedIndexes = new Set();
            const keysByCollection = await asyncGivenObservable_1.asyncGivenObservable({
                observable: this._keysByCollection,
            });
            const valuesByKeyByIndex = await asyncGivenObservable_1.asyncGivenObservable({
                observable: this._valuesByKeyByIndex,
            });
            existingRow.collections.forEach((collectionKey) => {
                const rowKeysOfThisCollection = keysByCollection.get(collectionKey);
                if (rowKeysOfThisCollection != null) {
                    rowKeysOfThisCollection.delete(rowKey);
                    changedCollections.add(collectionKey);
                }
            });
            for (const indexKey of existingRow.valuesByIndex.keys()) {
                const valuesByKey = valuesByKeyByIndex.get(indexKey);
                if (valuesByKey != null) {
                    valuesByKey.delete(rowKey);
                    changedIndexes.add(indexKey);
                }
            }
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedCollections), async (collectionKey) => {
                await updateKeysByCollection_1.updateKeysByCollection(this.props.adapters.props.collectionsAdapter, collectionKey, keysByCollection.get(collectionKey));
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedIndexes), async (indexKey) => {
                await updateValuesByKeyByIndex_1.updateValuesByKeyByIndex(this.props.adapters.props.indexesAdapter, indexKey, valuesByKeyByIndex.get(indexKey));
            });
            await this.props.adapters.props.dataAdapter.deleteKey(rowKey);
        };
        this._read = async (key) => {
            if (key == null) {
                throw new Error("Key is required");
            }
            if (key.length < 5) {
                throw new Error("Key length must be at least 5 characters");
            }
            const cachedRow = this._rowCache.get(key);
            if (cachedRow != null) {
                return cachedRow;
            }
            let serializable = await this.props.adapters.props.dataAdapter.toOptionalValue(key);
            if (serializable == null) {
                return undefined;
            }
            const valuesByIndex = new Map(Object.entries(serializable.valuesByIndex || {}));
            const result = {
                key: serializable.key,
                createdAt: time_1.Instant.givenEpochMilliseconds(serializable.createdAtMs),
                updatedAt: time_1.Instant.givenEpochMilliseconds(serializable.updatedAtMs),
                data: serializable.data,
                collections: new Set(serializable.collections),
                valuesByIndex,
            };
            this._rowCache.put(key, result);
            return result;
        };
        this._write = async (data, time, key) => {
            if (key == null) {
                key = node_crypto_1.UniqueId.ofRandom().toUUIDString();
            }
            if (key.length < 5) {
                throw new Error("Key length must be at least 5 characters");
            }
            let row = await this._read(key);
            const collections = this.props.collectionsGivenData(data);
            const valuesByIndex = this.props.valuesByIndexGivenData(data);
            if (row == null) {
                row = {
                    key,
                    createdAt: time,
                    updatedAt: time,
                    data: data,
                    collections: collections,
                    valuesByIndex: valuesByIndex,
                };
            }
            else {
                row.updatedAt = time;
                row.collections = collections;
                row.valuesByIndex = valuesByIndex;
                row.data = data;
            }
            this._rowCache.put(key, row);
            const serializable = {
                key: row.key,
                createdAtMs: row.createdAt.toEpochMilliseconds(),
                updatedAtMs: row.updatedAt.toEpochMilliseconds(),
                data: row.data,
            };
            if (row.collections != null && row.collections.size > 0) {
                serializable.collections = Array.from(row.collections);
            }
            if (row.valuesByIndex == null) {
                row.valuesByIndex = new Map();
            }
            row.valuesByIndex.set("createdAt", row.createdAt.toEpochMilliseconds());
            const obj = {};
            for (const [k, v] of row.valuesByIndex) {
                obj[k] = v;
            }
            serializable.valuesByIndex = obj;
            const changedCollections = new Set();
            const changedIndexes = new Set();
            const keysByCollection = await asyncGivenObservable_1.asyncGivenObservable({
                observable: this._keysByCollection,
            });
            const valuesByKeyByIndex = await asyncGivenObservable_1.asyncGivenObservable({
                observable: this._valuesByKeyByIndex,
            });
            row.collections.forEach((collection) => {
                if (!keysByCollection.has(collection)) {
                    keysByCollection.set(collection, new Set());
                }
            });
            for (const index of row.valuesByIndex.keys()) {
                if (!valuesByKeyByIndex.has(index)) {
                    valuesByKeyByIndex.set(index, new Map());
                }
            }
            for (const [collection, keys] of keysByCollection) {
                if (row.collections.has(collection)) {
                    if (!keys.has(row.key)) {
                        keys.add(row.key);
                        changedCollections.add(collection);
                    }
                }
                else {
                    if (keys.has(row.key)) {
                        keys.delete(row.key);
                        changedCollections.add(collection);
                    }
                }
            }
            for (const [index, valuesByKey] of valuesByKeyByIndex) {
                const value = row.valuesByIndex.get(index);
                const currentValue = valuesByKey.get(row.key);
                if (value != null && value !== currentValue) {
                    valuesByKey.set(row.key, value);
                    changedIndexes.add(index);
                }
                else if (value == null && currentValue != null) {
                    valuesByKey.delete(row.key);
                    changedIndexes.add(index);
                }
            }
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedCollections), async (collectionKey) => {
                await updateKeysByCollection_1.updateKeysByCollection(this.props.adapters.props.collectionsAdapter, collectionKey, keysByCollection.get(collectionKey));
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedIndexes), async (indexKey) => {
                await updateValuesByKeyByIndex_1.updateValuesByKeyByIndex(this.props.adapters.props.indexesAdapter, indexKey, valuesByKeyByIndex.get(indexKey));
            });
            await this.props.adapters.props.dataAdapter.setValue(key, serializable);
            return row;
        };
        this._listKeys = async (options = {}) => {
            let result;
            if (options.filter == null || options.filter.length === 0) {
                result = await asyncGivenObservable_1.asyncGivenObservable({ observable: this._allKeys });
            }
            else {
                const keysByCollection = await asyncGivenObservable_1.asyncGivenObservable({
                    observable: this._keysByCollection,
                });
                const sets = options.filter.map((collection) => {
                    return keysByCollection.get(collection) || new Set();
                });
                result = Array.from(util_1.SetUtil.intersectionGivenSets(sets));
            }
            const index = options.orderBy;
            if (index != null) {
                const valuesByKeyByIndex = await asyncGivenObservable_1.asyncGivenObservable({
                    observable: this._valuesByKeyByIndex,
                });
                const valuesByKey = valuesByKeyByIndex.get(index);
                if (valuesByKey == null) {
                    throw new Error(`Missing index '${index}'`);
                }
                result = util_1.ArrayUtil.arrayWithOrderFromValue(result, (key) => {
                    return valuesByKey.get(key) || 0;
                }, "ascending");
            }
            let start = 0;
            let end = result.length;
            if (options.offset != null) {
                start = parseInt(options.offset, 10);
            }
            if (options.limit != null) {
                end = Math.min(end, start + parseInt(options.limit, 10));
            }
            return result.slice(start, end);
        };
        this._listRows = async (options = {}) => {
            const keys = await this._listKeys(options);
            const results = [];
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(keys, async (key) => {
                const result = await this._read(key);
                if (result != null) {
                    results.push(result);
                }
            });
            return results;
        };
        this._nextInstruction = async () => {
            const instruction = this._instructions.shift();
            if (instruction == null) {
                return;
            }
            try {
                switch (instruction.type) {
                    case "write":
                        const writeResult = await this._write(instruction.data, instruction.time, instruction.key);
                        instruction.resolve(writeResult);
                        break;
                    case "read":
                        const readResult = await this._read(instruction.key);
                        instruction.resolve(readResult);
                        break;
                    case "delete":
                        await this._delete(instruction.key);
                        instruction.resolve();
                        break;
                    case "listKeys":
                        const listKeysResult = await this._listKeys(instruction.options);
                        instruction.resolve(listKeysResult);
                        break;
                    case "listRows":
                        const listRowsResult = await this._listRows(instruction.options);
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
        this._rowCache = new LRUCache_1.LRUCache(props.cacheSize || 10);
    }
    onActivate() {
        this.addActor(this.props.adapters);
        const checkIsReady = () => {
            this._isReady.setValue(this._allKeys.value != null &&
                this._keysByCollection.value != null &&
                this._valuesByKeyByIndex.value != null);
        };
        this.props.adapters.props.dataAdapter.toKeys().then((keys) => {
            this._allKeys.setValue(keys);
            checkIsReady();
        });
        keysByCollectionGivenAdapter_1.keysByCollectionGivenAdapter(this.props.adapters.props.collectionsAdapter).then((result) => {
            this._keysByCollection.setValue(result);
            checkIsReady();
        });
        valuesByKeyByIndexGivenFileDbDirectory_1.valuesByKeyByIndexGivenAdapter(this.props.adapters.props.indexesAdapter).then((result) => {
            this._valuesByKeyByIndex.setValue(result);
            checkIsReady();
        });
    }
    async toCollections() {
        const keysByCollection = await asyncGivenObservable_1.asyncGivenObservable({
            observable: this._keysByCollection,
        });
        return Array.from(keysByCollection.keys());
    }
    async toKeys(options = {}) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "listKeys",
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
    async hasKey(key) {
        const keys = await this.toKeys(); // await this to get an instruction into the queue
        return keys.includes(key);
    }
    async toCount(filter) {
        const keys = await this.toKeys({
            // await this to get an instruction into the queue
            filter,
        });
        return keys.length;
    }
    async toRows(options = {}) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "listRows",
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
    async toOptionalFirstRow(options = {}) {
        const results = await this.toRows(Object.assign(Object.assign({}, options), { limit: 1 }));
        return results[0];
    }
    async toRow(key) {
        const result = await this.toOptionalRowGivenKey(key);
        if (result == null) {
            throw new Error(`Row not found for key '${key}'`);
        }
        return result;
    }
    toOptionalRowGivenKey(key) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "read",
                key,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    writeRow(data, key) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "write",
                time: time_1.Instant.ofNow(),
                key,
                data,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
    deleteKey(key) {
        return new Promise((resolve, reject) => {
            const instruction = {
                type: "delete",
                key,
                resolve,
                reject,
            };
            this._instructions.push(instruction);
            if (this._instructions.length === 1) {
                this._nextInstruction();
            }
        });
    }
}
exports.FileDb = FileDb;
//# sourceMappingURL=index.js.map