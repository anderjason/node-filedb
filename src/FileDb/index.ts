import { EncryptedData, SecretKey, UniqueId } from "@anderjason/node-crypto";
import { LocalDirectory } from "@anderjason/node-filesystem";
import { Instant } from "@anderjason/time";
import { ArrayUtil, PromiseUtil, SetUtil } from "@anderjason/util";
import { LRUCache } from "./LRUCache";
import { keysByCollectionGivenFileDbDirectory } from "./_internal/keysByCollectionGivenFileDbDirectory";
import { localFileGivenFileDbKey } from "./_internal/localFileGivenFileDbKey";
import { promiseOfUpdatedFileDbCollection } from "./_internal/promiseOfUpdatedFileDbCollection";
import { promiseOfUpdatedFileDbIndex } from "./_internal/promiseOfUpdatedFileDbIndex";
import { rowKeysGivenFileDbDirectory } from "./_internal/rowKeysGivenFileDbDirectory";
import { valuesByKeyByIndexGivenFileDbDirectory } from "./_internal/valuesByKeyByIndexGivenFileDbDirectory";

export interface FileDbRow<T> {
  key: string;
  createdAt: Instant;
  updatedAt: Instant;
  data: T;
  collections: Set<string>;
  valuesByIndex: Map<string, number>;
}

interface SerializableFileDbRow {
  key: string;
  createdAtMs: number;
  updatedAtMs: number;
  data: any;

  collections?: string[];
  valuesByIndex?: {
    [index: string]: number;
  };
}

export interface SerializableFileDbCollection {
  collection: string;
  keys: string[];
}

export interface SerializableFileDbIndex {
  index: string;
  valuesByKey: {
    [key: string]: number;
  };
}

export interface FileDbReadOptions {
  filter?: string[];
  orderBy?: string;
  limit?: number;
  offset?: number;
}

interface FileDbWriteInstruction<T> {
  type: "write";
  time: Instant;
  key?: string;
  data: T;
  resolve: (result: FileDbRow<T>) => void;
  reject: (reason?: any) => void;
}

interface FileDbReadInstruction<T> {
  type: "read";
  key: string;
  resolve: (result: FileDbRow<T> | undefined) => void;
  reject: (reason?: any) => void;
}

interface FileDbDeleteInstruction {
  type: "delete";
  key: string;
  resolve: () => void;
  reject: (reason?: any) => void;
}

interface FileDbListKeysInstruction {
  type: "listKeys";
  options?: FileDbReadOptions;
  resolve: (result: string[]) => void;
  reject: (reason?: any) => void;
}

interface FileDbListRowsInstruction<T> {
  type: "listRows";
  options?: FileDbReadOptions;
  resolve: (result: FileDbRow<T>[]) => void;
  reject: (reason?: any) => void;
}

type FileDbInstruction<T> =
  | FileDbWriteInstruction<T>
  | FileDbReadInstruction<T>
  | FileDbDeleteInstruction
  | FileDbListKeysInstruction
  | FileDbListRowsInstruction<T>;

export interface FileDbDefinition<T> {
  label: string;
  directory: LocalDirectory;
  collectionsGivenData: (data: T) => Set<string>;
  valuesByIndexGivenData: (data: T) => Map<string, number>;

  encryptionKey?: SecretKey;
  cacheSize?: number;
}

export class FileDb<T> {
  static async ofDefinition<T>(
    definition: FileDbDefinition<T>
  ): Promise<FileDb<T>> {
    const result = new FileDb<T>(definition);
    await result.init();

    return result;
  }

  readonly directory: LocalDirectory;
  readonly label: string;

  private _collectionsGivenData: (data: T) => Set<string>;
  private _valuesByIndexGivenData: (data: T) => Map<string, number>;
  private _rowCache: LRUCache<FileDbRow<T>>;
  private _keysByCollection: Map<string, Set<string>>;
  private _valuesByKeyByIndex: Map<string, Map<string, number>>;
  private _encryptionKey?: SecretKey;
  private _allKeys: string[];
  private _instructions: FileDbInstruction<T>[] = [];

  private constructor(definition: FileDbDefinition<T>) {
    this.label = definition.label;
    this.directory = definition.directory;
    this._encryptionKey = definition.encryptionKey;
    this._rowCache = new LRUCache<FileDbRow<T>>(definition.cacheSize || 10);
    this._collectionsGivenData = definition.collectionsGivenData;
    this._valuesByIndexGivenData = definition.valuesByIndexGivenData;
  }

  async init(): Promise<void> {
    this._allKeys = await rowKeysGivenFileDbDirectory(this.directory);

    this._keysByCollection = await keysByCollectionGivenFileDbDirectory(
      this.directory,
      this._encryptionKey
    );

    this._valuesByKeyByIndex = await valuesByKeyByIndexGivenFileDbDirectory(
      this.directory,
      this._encryptionKey
    );
  }

  toCollections(): string[] {
    return Array.from(this._keysByCollection.keys());
  }

  async toKeys(options: FileDbReadOptions = {}): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbListKeysInstruction = {
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

  async hasKey(key: string): Promise<boolean> {
    const keys = await this.toKeys(); // await this to get an instruction into the queue
    return keys.includes(key);
  }

  async toCount(filter?: string[]): Promise<number> {
    const keys = await this.toKeys({
      // await this to get an instruction into the queue
      filter,
    });
    return keys.length;
  }

  async toRows(options: FileDbReadOptions = {}): Promise<FileDbRow<T>[]> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbListRowsInstruction<T> = {
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

  async toOptionalFirstRow(
    options: FileDbReadOptions = {}
  ): Promise<FileDbRow<T> | undefined> {
    const results = await this.toRows({
      ...options,
      limit: 1,
    });

    return results[0];
  }

  async toRowGivenKey(key: string): Promise<FileDbRow<T>> {
    const result = await this.toOptionalRowGivenKey(key);
    if (result == null) {
      throw new Error(`Row not found for key '${key}'`);
    }

    return result;
  }

  toOptionalRowGivenKey(key: string): Promise<FileDbRow<T> | undefined> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbReadInstruction<T> = {
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

  toWritePromise(data: T, key?: string): Promise<FileDbRow<T>> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbWriteInstruction<T> = {
        type: "write",
        time: Instant.ofNow(),
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

  toDeletePromise = (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const instruction: FileDbDeleteInstruction = {
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

  private _delete = async (rowKey: string): Promise<void> => {
    if (rowKey.length < 5) {
      throw new Error("Key length must be at least 5 characters");
    }

    this._rowCache.remove(rowKey);

    const file = localFileGivenFileDbKey(this.directory, rowKey);

    const existingRow = await this.toOptionalRowGivenKey(rowKey);
    if (existingRow == null) {
      return;
    }

    const changedCollections = new Set<string>();
    const changedIndexes = new Set<string>();

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

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedCollections),
      async (collectionKey) => {
        await promiseOfUpdatedFileDbCollection(
          this.directory,
          collectionKey,
          this._keysByCollection.get(collectionKey),
          this._encryptionKey
        );
      }
    );

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedIndexes),
      async (indexKey) => {
        await promiseOfUpdatedFileDbIndex(
          this.directory,
          indexKey,
          this._valuesByKeyByIndex.get(indexKey),
          this._encryptionKey
        );
      }
    );

    await file.deleteFile();
  };

  private _read = async (key: string): Promise<FileDbRow<T> | undefined> => {
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

    const file = localFileGivenFileDbKey(this.directory, key);

    const isAccessible = await file.isAccessible();
    if (!isAccessible) {
      return undefined;
    }

    const rawFileContents = await file.toContentString();
    let contents: string;

    if (this._encryptionKey != null) {
      contents = EncryptedData.givenEncryptedHexString(
        rawFileContents
      ).toDecryptedString(this._encryptionKey);
    } else {
      contents = rawFileContents;
    }

    const serializable = JSON.parse(contents) as SerializableFileDbRow;

    const valuesByIndex = new Map<string, number>(
      Object.entries(serializable.valuesByIndex || {})
    );

    const result: FileDbRow<T> = {
      key: serializable.key,
      createdAt: Instant.givenEpochMilliseconds(serializable.createdAtMs),
      updatedAt: Instant.givenEpochMilliseconds(serializable.updatedAtMs),
      data: serializable.data,
      collections: new Set(serializable.collections),
      valuesByIndex,
    };

    this._rowCache.put(key, result);

    return result;
  };

  private _write = async (
    data: T,
    time: Instant,
    key?: string
  ): Promise<FileDbRow<T>> => {
    if (key == null) {
      key = UniqueId.ofRandom().toUUIDString();
    }

    if (key.length < 5) {
      throw new Error("Key length must be at least 5 characters");
    }

    let row: FileDbRow<T> | undefined = await this._read(key);

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
    } else {
      row.updatedAt = time;
      row.collections = collections;
      row.valuesByIndex = valuesByIndex;
      row.data = data;
    }

    this._rowCache.put(key, row);

    const file = localFileGivenFileDbKey(this.directory, key);

    const serializable: SerializableFileDbRow = {
      key: row.key,
      createdAtMs: row.createdAt.toEpochMilliseconds(),
      updatedAtMs: row.updatedAt.toEpochMilliseconds(),
      data: row.data,
    };

    if (row.collections != null && row.collections.size > 0) {
      serializable.collections = Array.from(row.collections);
    }

    if (row.valuesByIndex == null) {
      row.valuesByIndex = new Map<string, number>();
    }

    row.valuesByIndex.set("createdAt", row.createdAt.toEpochMilliseconds());

    const obj: any = {};
    for (const [k, v] of row.valuesByIndex) {
      obj[k] = v;
    }
    serializable.valuesByIndex = obj;

    const changedCollections = new Set<string>();
    const changedIndexes = new Set<string>();

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
      } else {
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
      } else if (value == null && currentValue != null) {
        valuesByKey.delete(row.key);
        changedIndexes.add(index);
      }
    }

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedCollections),
      async (collectionKey) => {
        await promiseOfUpdatedFileDbCollection(
          this.directory,
          collectionKey,
          this._keysByCollection.get(collectionKey),
          this._encryptionKey
        );
      }
    );

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedIndexes),
      async (indexKey) => {
        await promiseOfUpdatedFileDbIndex(
          this.directory,
          indexKey,
          this._valuesByKeyByIndex.get(indexKey),
          this._encryptionKey
        );
      }
    );

    const contents = JSON.stringify(serializable, null, 2);

    let rawFileContents: string;
    if (this._encryptionKey != null) {
      rawFileContents = EncryptedData.givenDecryptedStringAndKey(
        contents,
        this._encryptionKey
      ).toEncryptedHexString();
    } else {
      rawFileContents = contents;
    }

    await file.writeFile(rawFileContents);

    return row;
  };

  private _listKeys = async (
    options: FileDbReadOptions = {}
  ): Promise<string[]> => {
    let result: string[];

    if (options.filter == null || options.filter.length === 0) {
      result = this._allKeys;
    } else {
      const sets = options.filter.map((collection) => {
        return this._keysByCollection.get(collection) || new Set<string>();
      });

      result = Array.from(SetUtil.intersectionGivenSets(sets));
    }

    const index = options.orderBy;
    if (index != null) {
      const valuesByKey = this._valuesByKeyByIndex.get(index);
      if (valuesByKey == null) {
        throw new Error(`Missing index '${index}'`);
      }

      result = ArrayUtil.arrayWithOrderFromValue(
        result,
        (key) => {
          return valuesByKey.get(key) || 0;
        },
        "ascending"
      );
    }

    let start = 0;
    let end = result.length;

    if (options.offset != null) {
      start = parseInt(options.offset as any, 10);
    }

    if (options.limit != null) {
      end = Math.min(end, start + parseInt(options.limit as any, 10));
    }

    return result.slice(start, end);
  };

  private _listRows = async (
    options: FileDbReadOptions = {}
  ): Promise<FileDbRow<T>[]> => {
    const keys = await this._listKeys(options);

    const results: FileDbRow<T>[] = [];

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(keys, async (key) => {
      const result = await this._read(key);
      if (result != null) {
        results.push(result);
      }
    });

    return results;
  };

  private _nextInstruction = async (): Promise<void> => {
    const instruction = this._instructions.shift();
    if (instruction == null) {
      return;
    }

    try {
      switch (instruction.type) {
        case "write":
          const writeResult: FileDbRow<T> = await this._write(
            instruction.data,
            instruction.time,
            instruction.key
          );
          instruction.resolve(writeResult);
          break;
        case "read":
          const readResult: FileDbRow<T> | undefined = await this._read(
            instruction.key
          );
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
    } catch (err) {
      instruction.reject(err);
    }

    if (this._instructions.length > 0) {
      setTimeout(this._nextInstruction, 1);
    }
  };
}
