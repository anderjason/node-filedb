import { UniqueId } from "@anderjason/node-crypto";
import { Actor } from "skytree";
import { Instant } from "@anderjason/time";
import { ArrayUtil, PromiseUtil, SetUtil } from "@anderjason/util";
import { LRUCache } from "../LRUCache";
import { Metric } from "./Metric";
import { Tag } from "./Tag";
import { FileDbAdapters, PortableRecord } from "../FileDbAdapters";
import {
  Dict,
  Observable,
  ObservableDict,
  ReadOnlyObservable,
} from "@anderjason/observable";
import { DbRecord } from "./DbRecord";

export interface FileDbReadOptions {
  requireTagKeys?: string[];
  orderByMetricKey?: string;
  limit?: number;
  offset?: number;
}

interface FileDbWriteInstruction<T> {
  type: "write";
  time: Instant;
  key?: string;
  data: T;
  resolve: (result: DbRecord<T>) => void;
  reject: (reason?: any) => void;
}

interface FileDbReadInstruction<T> {
  type: "read";
  key: string;
  resolve: (result: DbRecord<T> | undefined) => void;
  reject: (reason?: any) => void;
}

interface FileDbDeleteInstruction {
  type: "delete";
  key: string;
  resolve: () => void;
  reject: (reason?: any) => void;
}

interface FileDbListRecordKeysInstruction {
  type: "listRecordKeys";
  options?: FileDbReadOptions;
  resolve: (result: string[]) => void;
  reject: (reason?: any) => void;
}

interface FileDbListRecordsInstruction<T> {
  type: "listRecords";
  options?: FileDbReadOptions;
  resolve: (result: DbRecord<T>[]) => void;
  reject: (reason?: any) => void;
}

type FileDbInstruction<T> =
  | FileDbWriteInstruction<T>
  | FileDbReadInstruction<T>
  | FileDbDeleteInstruction
  | FileDbListRecordKeysInstruction
  | FileDbListRecordsInstruction<T>;

export interface FileDbProps<T> {
  adapters: FileDbAdapters;

  tagKeysGivenRecordData: (data: T) => Set<string>;
  metricsGivenRecordData: (data: T) => Dict<number>;

  cacheSize?: number;
}

export class FileDb<T> extends Actor<FileDbProps<T>> {
  private _isReady = Observable.givenValue(false, Observable.isStrictEqual);
  readonly isReady = ReadOnlyObservable.givenObservable(this._isReady);

  private _recordCache: LRUCache<DbRecord<T>>;
  private _tags = ObservableDict.ofEmpty<Tag>();
  private _metrics = ObservableDict.ofEmpty<Metric>();
  private _allRecordKeys = Observable.ofEmpty<string[]>();
  private _instructions: FileDbInstruction<T>[] = [];

  constructor(props: FileDbProps<T>) {
    super(props);

    this._recordCache = new LRUCache<DbRecord<T>>(props.cacheSize || 10);
  }

  onActivate(): void {
    this.addActor(this.props.adapters);

    this.load();
  }

  get tags(): Tag[] {
    return Object.values(this._tags.toValues());
  }

  get metrics(): Metric[] {
    return Object.values(this._metrics.toValues());
  }

  private async load(): Promise<void> {
    if (this.isActive.value == false) {
      return;
    }

    const tagsAdapter = this.props.adapters.props.tagsAdapter;
    const metricsAdapter = this.props.adapters.props.metricsAdapter;

    const tagKeys = await tagsAdapter.toKeys();
    const metricKeys = await metricsAdapter.toKeys();

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      tagKeys,
      async (tagKey) => {
        const tag = new Tag({
          tagKey,
          adapter: tagsAdapter,
        });

        await tag.load();

        this._tags.setValue(tagKey, tag);
      }
    );

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      metricKeys,
      async (metricKey) => {
        const metric = new Metric({
          metricKey,
          adapter: metricsAdapter,
        });

        await metric.load();

        this._metrics.setValue(metricKey, metric);
      }
    );

    this._isReady.setValue(true);
  }

  async toRecordKeys(options: FileDbReadOptions = {}): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbListRecordKeysInstruction = {
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

  async hasRecord(recordKey: string): Promise<boolean> {
    const keys = await this.toRecordKeys();
    return keys.includes(recordKey);
  }

  async toRecordCount(requireTagKeys?: string[]): Promise<number> {
    const keys = await this.toRecordKeys({
      requireTagKeys: requireTagKeys,
    });

    return keys.length;
  }

  async toRecords(options: FileDbReadOptions = {}): Promise<DbRecord<T>[]> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbListRecordsInstruction<T> = {
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

  async toOptionalFirstRecord(
    options: FileDbReadOptions = {}
  ): Promise<DbRecord<T> | undefined> {
    const results = await this.toRecords({
      ...options,
      limit: 1,
    });

    return results[0];
  }

  async toRecordGivenKey(recordKey: string): Promise<DbRecord<T>> {
    const result = await this.toOptionalRecordGivenKey(recordKey);
    if (result == null) {
      throw new Error(`Record not found for key '${recordKey}'`);
    }

    return result;
  }

  toOptionalRecordGivenKey(
    recordKey: string
  ): Promise<DbRecord<T> | undefined> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbReadInstruction<T> = {
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

  writeRecord(recordData: T, recordKey?: string): Promise<DbRecord<T>> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbWriteInstruction<T> = {
        type: "write",
        time: Instant.ofNow(),
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

  deleteKey(recordKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbDeleteInstruction = {
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

  async ensureReady(): Promise<void> {
    await this._isReady.toPromise((v) => v == true);
  }

  private _deleteRecord = async (recordKey: string): Promise<void> => {
    if (recordKey.length < 5) {
      throw new Error("Record key length must be at least 5 characters");
    }

    this._recordCache.remove(recordKey);

    const existingRecord = await this.toOptionalRecordGivenKey(recordKey);
    if (existingRecord == null) {
      return;
    }

    await this.ensureReady();

    const changedTags = new Set<Tag>();
    const changedMetrics = new Set<Metric>();

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

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedTags),
      async (tag) => {
        await tag.save();
      }
    );

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedMetrics),
      async (metric) => {
        await metric.save();
      }
    );

    await this.props.adapters.props.recordsAdapter.deleteKey(recordKey);
  };

  private _readRecord = async (
    recordKey: string
  ): Promise<DbRecord<T> | undefined> => {
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

    let portableRecord = await this.props.adapters.props.recordsAdapter.toOptionalValueGivenKey(
      recordKey
    );

    if (portableRecord == null) {
      return undefined;
    }

    const result: DbRecord<T> = new DbRecord({
      recordKey: portableRecord.recordKey,
      createdAt: Instant.givenEpochMilliseconds(portableRecord.createdAtMs),
      updatedAt: Instant.givenEpochMilliseconds(portableRecord.updatedAtMs),
      recordData: portableRecord.data,
      tagKeys: new Set(portableRecord.tagKeys),
      metricValues: portableRecord.metricValues || {},
    });

    this._recordCache.put(recordKey, result);

    return result;
  };

  private _writeRecord = async (
    recordData: T,
    time: Instant,
    recordKey?: string
  ): Promise<DbRecord<T>> => {
    if (recordKey == null) {
      recordKey = UniqueId.ofRandom().toUUIDString();
    }

    if (recordKey.length < 5) {
      throw new Error("Record key length must be at least 5 characters");
    }

    await this.ensureReady();

    let record: DbRecord<T> | undefined = await this._readRecord(recordKey);

    const tagKeys: Set<string> = this.props.tagKeysGivenRecordData(recordData);
    const metricValues = this.props.metricsGivenRecordData(recordData);

    if (record == null) {
      record = new DbRecord({
        recordKey,
        createdAt: time,
        updatedAt: time,
        recordData,
        tagKeys,
        metricValues,
      });
    } else {
      record.updatedAt.setValue(time);
      record.tagKeys.sync(tagKeys);
      record.metricValues.sync(metricValues);
      record.recordData.setValue(recordData);
    }

    this._recordCache.put(recordKey, record);

    const portableRecord: PortableRecord = {
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

    record.metricValues.setValue(
      "createdAt",
      record.createdAt.value.toEpochMilliseconds()
    );

    portableRecord.metricValues = record.metricValues.toValues();

    const changedTags = new Set<Tag>();
    const changedMetrics = new Set<Metric>();

    record.tagKeys.toArray().forEach((tagKey) => {
      let tag = this._tags.toOptionalValueGivenKey(tagKey);
      if (tag == null) {
        tag = new Tag({
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
        metric = new Metric({
          metricKey,
          adapter: this.props.adapters.props.metricsAdapter,
        });
        this._metrics.setValue(metricKey, metric);
      }

      const metricValue = record.metricValues.toOptionalValueGivenKey(
        metricKey
      );

      if (
        metric.recordMetricValues.toOptionalValueGivenKey(recordKey) !==
        metricValue
      ) {
        metric.recordMetricValues.setValue(recordKey, metricValue);
        changedMetrics.add(metric);
      }
    });

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedTags),
      async (tag) => {
        await tag.save();
      }
    );

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      Array.from(changedMetrics),
      async (metric) => {
        await metric.save();
      }
    );

    await this.props.adapters.props.recordsAdapter.writeValue(
      recordKey,
      portableRecord
    );

    return record;
  };

  private _listRecordKeys = async (
    options: FileDbReadOptions = {}
  ): Promise<string[]> => {
    let recordKeys: string[];

    await this.ensureReady();

    if (options.requireTagKeys == null || options.requireTagKeys.length === 0) {
      recordKeys = this._allRecordKeys.value;
    } else {
      const sets = options.requireTagKeys.map((tagKey) => {
        const tag = this._tags.toOptionalValueGivenKey(tagKey);
        if (tag == null) {
          return new Set<string>();
        }

        return tag.recordKeys.toSet();
      });

      recordKeys = Array.from(SetUtil.intersectionGivenSets(sets));
    }

    const metricKey = options.orderByMetricKey;
    if (metricKey != null) {
      const metric = this._metrics.toOptionalValueGivenKey(metricKey);
      if (metric == null) {
        throw new Error(`Metric is not defined '${metricKey}'`);
      }

      recordKeys = ArrayUtil.arrayWithOrderFromValue(
        recordKeys,
        (recordKey) => {
          const metricValue = metric.recordMetricValues.toOptionalValueGivenKey(
            recordKey
          );
          return metricValue || 0;
        },
        "ascending"
      );
    }

    let start = 0;
    let end = recordKeys.length;

    if (options.offset != null) {
      start = parseInt(options.offset as any, 10);
    }

    if (options.limit != null) {
      end = Math.min(end, start + parseInt(options.limit as any, 10));
    }

    return recordKeys.slice(start, end);
  };

  private _listRecords = async (
    options: FileDbReadOptions = {}
  ): Promise<DbRecord<T>[]> => {
    const recordKeys = await this._listRecordKeys(options);

    const records: DbRecord<T>[] = [];

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      recordKeys,
      async (recordKey) => {
        const result = await this._readRecord(recordKey);
        if (result != null) {
          records.push(result);
        }
      }
    );

    return records;
  };

  private _nextInstruction = async (): Promise<void> => {
    const instruction = this._instructions.shift();
    if (instruction == null) {
      return;
    }

    try {
      switch (instruction.type) {
        case "write":
          const writeResult: DbRecord<T> = await this._writeRecord(
            instruction.data,
            instruction.time,
            instruction.key
          );
          instruction.resolve(writeResult);
          break;
        case "read":
          const readResult: DbRecord<T> | undefined = await this._readRecord(
            instruction.key
          );
          instruction.resolve(readResult);
          break;
        case "delete":
          await this._deleteRecord(instruction.key);
          instruction.resolve();
          break;
        case "listRecordKeys":
          const listKeysResult = await this._listRecordKeys(
            instruction.options
          );
          instruction.resolve(listKeysResult);
          break;
        case "listRecords":
          const listRowsResult = await this._listRecords(instruction.options);
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
