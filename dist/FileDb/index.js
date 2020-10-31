"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDb = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const time_1 = require("@anderjason/time");
const util_1 = require("@anderjason/util");
const LRUCache_1 = require("./LRUCache");
const keysByCollectionGivenFileDbDirectory_1 = require("./_internal/keysByCollectionGivenFileDbDirectory");
const localFileGivenFileDbKey_1 = require("./_internal/localFileGivenFileDbKey");
const promiseOfUpdatedFileDbCollection_1 = require("./_internal/promiseOfUpdatedFileDbCollection");
const promiseOfUpdatedFileDbIndex_1 = require("./_internal/promiseOfUpdatedFileDbIndex");
const rowKeysGivenFileDbDirectory_1 = require("./_internal/rowKeysGivenFileDbDirectory");
const valuesByKeyByIndexGivenFileDbDirectory_1 = require("./_internal/valuesByKeyByIndexGivenFileDbDirectory");
class FileDb {
    constructor(definition) {
        this._instructions = [];
        this.toDeletePromise = (key) => {
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
        };
        this._delete = async (rowKey) => {
            if (rowKey.length < 5) {
                throw new Error("Key length must be at least 5 characters");
            }
            this._rowCache.remove(rowKey);
            const file = localFileGivenFileDbKey_1.localFileGivenFileDbKey(this.directory, rowKey);
            const existingRow = await this.toOptionalRowGivenKey(rowKey);
            if (existingRow == null) {
                return;
            }
            const changedCollections = new Set();
            const changedIndexes = new Set();
            existingRow.collections.forEach((collectionKey) => {
                const rowKeysOfThisCollection = this._keysByCollection.get(collectionKey);
                if (rowKeysOfThisCollection != null) {
                    rowKeysOfThisCollection.delete(rowKey);
                    changedCollections.add(collectionKey);
                }
            });
            for (const indexKey of existingRow.valuesByIndex.keys()) {
                const valuesByKey = this._valuesByKeyByIndex.get(indexKey);
                if (valuesByKey != null) {
                    valuesByKey.delete(rowKey);
                    changedIndexes.add(indexKey);
                }
            }
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedCollections), async (collectionKey) => {
                await promiseOfUpdatedFileDbCollection_1.promiseOfUpdatedFileDbCollection(this.directory, collectionKey, this._keysByCollection.get(collectionKey), this._encryptionKey);
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedIndexes), async (indexKey) => {
                await promiseOfUpdatedFileDbIndex_1.promiseOfUpdatedFileDbIndex(this.directory, indexKey, this._valuesByKeyByIndex.get(indexKey), this._encryptionKey);
            });
            await file.deleteFile();
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
            const file = localFileGivenFileDbKey_1.localFileGivenFileDbKey(this.directory, key);
            const isAccessible = await file.isAccessible();
            if (!isAccessible) {
                return undefined;
            }
            const rawFileContents = await file.toContentString();
            let contents;
            if (this._encryptionKey != null) {
                contents = node_crypto_1.EncryptedData.givenEncryptedHexString(rawFileContents).toDecryptedString(this._encryptionKey);
            }
            else {
                contents = rawFileContents;
            }
            const serializable = JSON.parse(contents);
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
            const collections = this._collectionsGivenData(data);
            const valuesByIndex = this._valuesByIndexGivenData(data);
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
            const file = localFileGivenFileDbKey_1.localFileGivenFileDbKey(this.directory, key);
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
            row.collections.forEach((collection) => {
                if (!this._keysByCollection.has(collection)) {
                    this._keysByCollection.set(collection, new Set());
                }
            });
            for (const index of row.valuesByIndex.keys()) {
                if (!this._valuesByKeyByIndex.has(index)) {
                    this._valuesByKeyByIndex.set(index, new Map());
                }
            }
            for (const [collection, keys] of this._keysByCollection) {
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
            for (const [index, valuesByKey] of this._valuesByKeyByIndex) {
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
                await promiseOfUpdatedFileDbCollection_1.promiseOfUpdatedFileDbCollection(this.directory, collectionKey, this._keysByCollection.get(collectionKey), this._encryptionKey);
            });
            await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(Array.from(changedIndexes), async (indexKey) => {
                await promiseOfUpdatedFileDbIndex_1.promiseOfUpdatedFileDbIndex(this.directory, indexKey, this._valuesByKeyByIndex.get(indexKey), this._encryptionKey);
            });
            const contents = JSON.stringify(serializable, null, 2);
            let rawFileContents;
            if (this._encryptionKey != null) {
                rawFileContents = node_crypto_1.EncryptedData.givenDecryptedStringAndKey(contents, this._encryptionKey).toEncryptedHexString();
            }
            else {
                rawFileContents = contents;
            }
            await file.writeFile(rawFileContents);
            return row;
        };
        this._listKeys = async (options = {}) => {
            let result;
            if (options.filter == null || options.filter.length === 0) {
                result = this._allKeys;
            }
            else {
                const sets = options.filter.map((collection) => {
                    return this._keysByCollection.get(collection) || new Set();
                });
                result = Array.from(util_1.SetUtil.intersectionGivenSets(sets));
            }
            const index = options.orderBy;
            if (index != null) {
                const valuesByKey = this._valuesByKeyByIndex.get(index);
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
        this.label = definition.label;
        this.directory = definition.directory;
        this._encryptionKey = definition.encryptionKey;
        this._rowCache = new LRUCache_1.LRUCache(definition.cacheSize || 10);
        this._collectionsGivenData = definition.collectionsGivenData;
        this._valuesByIndexGivenData = definition.valuesByIndexGivenData;
    }
    static async ofDefinition(definition) {
        const result = new FileDb(definition);
        await result.init();
        return result;
    }
    async init() {
        this._allKeys = await rowKeysGivenFileDbDirectory_1.rowKeysGivenFileDbDirectory(this.directory);
        this._keysByCollection = await keysByCollectionGivenFileDbDirectory_1.keysByCollectionGivenFileDbDirectory(this.directory, this._encryptionKey);
        this._valuesByKeyByIndex = await valuesByKeyByIndexGivenFileDbDirectory_1.valuesByKeyByIndexGivenFileDbDirectory(this.directory, this._encryptionKey);
    }
    toCollections() {
        return Array.from(this._keysByCollection.keys());
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
    async toRowGivenKey(key) {
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
    toWritePromise(data, key) {
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
}
exports.FileDb = FileDb;
//# sourceMappingURL=index.js.map