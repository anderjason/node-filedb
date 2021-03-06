import { UniqueId } from "@anderjason/node-crypto";
import { Actor } from "skytree";
import { Instant } from "@anderjason/time";
import { ArrayUtil, PromiseUtil, SetUtil } from "@anderjason/util";
import { LRUCache } from "../LRUCache";
import { Metric } from "../Metric";
import { Tag } from "../Tag";
import { Entry } from "../Entry";
import { FileDbAdapters } from "../FileDbAdapters";
import {
  Dict,
  Observable,
  ReadOnlyObservable,
} from "@anderjason/observable";

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
  resolve: (result: Entry<T>) => void;
  reject: (reason?: any) => void;
}

interface FileDbReadInstruction<T> {
  type: "read";
  key: string;
  resolve: (result: Entry<T> | undefined) => void;
  reject: (reason?: any) => void;
}

interface FileDbDeleteInstruction {
  type: "delete";
  key: string;
  resolve: () => void;
  reject: (reason?: any) => void;
}

interface FileDbListEntryKeysInstruction {
  type: "listEntryKeys";
  options?: FileDbReadOptions;
  resolve: (result: string[]) => void;
  reject: (reason?: any) => void;
}

interface FileDbListEntriesInstruction<T> {
  type: "listEntries";
  options?: FileDbReadOptions;
  resolve: (result: Entry<T>[]) => void;
  reject: (reason?: any) => void;
}

type FileDbInstruction<T> =
  | FileDbWriteInstruction<T>
  | FileDbReadInstruction<T>
  | FileDbDeleteInstruction
  | FileDbListEntryKeysInstruction
  | FileDbListEntriesInstruction<T>;

export interface FileDbProps<T> {
  adapters: FileDbAdapters;

  tagKeysGivenEntryData: (data: T) => string[];
  metricsGivenEntryData: (data: T) => Dict<number>;

  cacheSize?: number;
}

export class FileDb<T> extends Actor<FileDbProps<T>> {
  private _isReady = Observable.givenValue(false, Observable.isStrictEqual);
  readonly isReady = ReadOnlyObservable.givenObservable(this._isReady);

  private _entryCache: LRUCache<Entry<T>>;
  private _tagPrefixes = new Set<string>();
  private _tags = new Map<string, Tag>();
  private _metrics = new Map<string, Metric>();
  private _allEntryKeys = new Set<string>();
  private _instructions: FileDbInstruction<T>[] = [];

  readonly adapters: FileDbAdapters;

  constructor(props: FileDbProps<T>) {
    super(props);

    this.adapters = props.adapters;
    this._entryCache = new LRUCache<Entry<T>>(props.cacheSize || 10);
  }

  onActivate(): void {
    this.addActor(this.adapters);

    this.load();
  }

  get tags(): Tag[] {
    return Array.from(this._tags.values());
  }

  get metrics(): Metric[] {
    return Array.from(this._metrics.values());
  }

  get tagPrefixes(): string[] {
    return Array.from(this._tagPrefixes);
  }

  private async load(): Promise<void> {
    if (this.isActive.value == false) {
      return;
    }

    const entriesAdapter = this.props.adapters.props.entriesAdapter;
    const tagsAdapter = this.props.adapters.props.tagsAdapter;
    const metricsAdapter = this.props.adapters.props.metricsAdapter;

    const entryKeys = await entriesAdapter.toKeys();
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

        this._tags.set(tagKey, tag);
        this._tagPrefixes.add(tag.tagPrefix);
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

        this._metrics.set(metricKey, metric);
      }
    );

    this._allEntryKeys = new Set(entryKeys);

    this._isReady.setValue(true);
  }

  async toEntryKeys(options: FileDbReadOptions = {}): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbListEntryKeysInstruction = {
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

  async hasEntry(entryKey: string): Promise<boolean> {
    const keys = await this.toEntryKeys();
    return keys.includes(entryKey);
  }

  async toEntryCount(requireTagKeys?: string[]): Promise<number> {
    const keys = await this.toEntryKeys({
      requireTagKeys: requireTagKeys,
    });

    return keys.length;
  }

  async toEntries(options: FileDbReadOptions = {}): Promise<Entry<T>[]> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbListEntriesInstruction<T> = {
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

  async toOptionalFirstEntry(
    options: FileDbReadOptions = {}
  ): Promise<Entry<T> | undefined> {
    const results = await this.toEntries({
      ...options,
      limit: 1,
    });

    return results[0];
  }

  async toEntryGivenKey(entryKey: string): Promise<Entry<T>> {
    const result = await this.toOptionalEntryGivenKey(entryKey);
    if (result == null) {
      throw new Error(`Entry not found for key '${entryKey}'`);
    }

    return result;
  }

  toOptionalEntryGivenKey(entryKey: string): Promise<Entry<T> | undefined> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbReadInstruction<T> = {
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

  writeEntry(entryData: T, entryKey?: string): Promise<Entry<T>> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbWriteInstruction<T> = {
        type: "write",
        time: Instant.ofNow(),
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

  deleteEntryKey(entryKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const instruction: FileDbDeleteInstruction = {
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

  async ensureReady(): Promise<void> {
    await this._isReady.toPromise((v) => v == true);
  }

  private _deleteEntry = async (entryKey: string): Promise<void> => {
    if (entryKey.length < 5) {
      throw new Error("Entry key length must be at least 5 characters");
    }

    this._entryCache.remove(entryKey);
    this._allEntryKeys.delete(entryKey);

    const existingRecord = await this.toOptionalEntryGivenKey(entryKey);
    if (existingRecord == null) {
      return;
    }

    if (this._isReady.value == false) {
      await this.ensureReady();
    }

    const changedTags = new Set<Tag>();
    const changedMetrics = new Set<Metric>();

    existingRecord.tagKeys.forEach((tagKey) => {
      const tag = this._tags.get(tagKey);

      if (tag != null && tag.entryKeys.has(entryKey)) {
        tag.entryKeys.delete(entryKey);
        changedTags.add(tag);
      }
    });

    const metricKeys = Object.keys(existingRecord.metricValues);
    metricKeys.forEach((metricKey) => {
      const metric = this._metrics.get(metricKey);

      if (metric != null && metric.hasValueGivenEntryKey(entryKey)) {
        metric.removeValueGivenEntryKey(entryKey);
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

    await this.props.adapters.props.entriesAdapter.deleteKey(entryKey);
  };

  private _readEntry = async (
    entryKey: string
  ): Promise<Entry<T> | undefined> => {
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

    let portableEntry = await this.props.adapters.props.entriesAdapter.toOptionalValueGivenKey(
      entryKey
    );

    if (portableEntry == null) {
      return undefined;
    }

    const result: Entry<T> = Entry.givenPortableObject<T>(portableEntry);

    this._entryCache.put(entryKey, result);

    return result;
  };

  private _writeEntry = async (
    entryData: T,
    time: Instant,
    entryKey?: string
  ): Promise<Entry<T>> => {
    if (entryKey == null) {
      entryKey = UniqueId.ofRandom().toUUIDString();
    }

    if (entryKey.length < 5) {
      throw new Error("Entry key length must be at least 5 characters");
    }

    if (this._isReady.value == false) {
      await this.ensureReady();
    }

    let entry: Entry<T> = await this._readEntry(entryKey);

    const tagKeys: string[] = this.props.tagKeysGivenEntryData(entryData);
    const metricValues = this.props.metricsGivenEntryData(entryData);

    if (entry == null) {
      entry = new Entry({
        key: entryKey,
        createdAt: time,
        updatedAt: time,
        data: entryData,
        tagKeys,
        metricValues,
      });
    } else {
      entry.updatedAt = time;
      entry.tagKeys = tagKeys;
      entry.metricValues = metricValues;
      entry.data = entryData;
    }

    entry.metricValues.createdAt = entry.createdAt.toEpochMilliseconds();

    this._entryCache.put(entryKey, entry);
    this._allEntryKeys.add(entryKey);

    const portableEntry = entry.toPortableObject();

    const changedTags = new Set<Tag>();
    const changedMetrics = new Set<Metric>();

    entry.tagKeys.forEach((tagKey) => {
      let tag = this._tags.get(tagKey);
      if (tag == null) {
        tag = new Tag({
          tagKey,
          adapter: this.props.adapters.props.tagsAdapter,
        });
        this._tags.set(tagKey, tag);
      }

      if (!tag.entryKeys.has(entryKey)) {
        tag.entryKeys.add(entryKey);
        changedTags.add(tag);
      }
    });

    const metricKeys = Object.keys(entry.metricValues);

    metricKeys.forEach((metricKey) => {
      let metric = this._metrics.get(metricKey);
      if (metric == null) {
        metric = new Metric({
          metricKey,
          adapter: this.props.adapters.props.metricsAdapter,
        });
        this._metrics.set(metricKey, metric);
      }

      const metricValue = entry.metricValues[metricKey];

      if (metric.toOptionalValueGivenEntryKey(entryKey) !== metricValue) {
        metric.setEntryMetricValue(entryKey, metricValue);
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

    await this.props.adapters.props.entriesAdapter.writeValue(
      entryKey,
      portableEntry
    );

    return entry;
  };

  private _listRecordKeys = async (
    options: FileDbReadOptions = {}
  ): Promise<string[]> => {
    let entryKeys: string[];

    if (this._isReady.value == false) {
      await this.ensureReady();
    }

    if (options.requireTagKeys == null || options.requireTagKeys.length === 0) {
      entryKeys = Array.from(this._allEntryKeys);
    } else {
      const sets = options.requireTagKeys.map((tagKey) => {
        const tag = this._tags.get(tagKey);
        if (tag == null) {
          return new Set<string>();
        }

        return tag.entryKeys;
      });

      entryKeys = Array.from(SetUtil.intersectionGivenSets(sets));
    }

    const metricKey = options.orderByMetricKey;
    if (metricKey != null) {
      const metric = this._metrics.get(metricKey);
      if (metric == null) {
        throw new Error(`Metric is not defined '${metricKey}'`);
      }

      entryKeys = ArrayUtil.arrayWithOrderFromValue(
        entryKeys,
        (entryKey) => {
          const metricValue = metric.toOptionalValueGivenEntryKey(entryKey);
          return metricValue || 0;
        },
        "ascending"
      );
    }

    let start = 0;
    let end = entryKeys.length;

    if (options.offset != null) {
      start = parseInt(options.offset as any, 10);
    }

    if (options.limit != null) {
      end = Math.min(end, start + parseInt(options.limit as any, 10));
    }

    return entryKeys.slice(start, end);
  };

  private _listRecords = async (
    options: FileDbReadOptions = {}
  ): Promise<Entry<T>[]> => {
    const entryKeys = await this._listRecordKeys(options);

    const entries: Entry<T>[] = [];

    await PromiseUtil.asyncSequenceGivenArrayAndCallback(
      entryKeys,
      async (entryKey) => {
        const result = await this._readEntry(entryKey);
        if (result != null) {
          entries.push(result);
        }
      }
    );

    return entries;
  };

  private _nextInstruction = async (): Promise<void> => {
    const instruction = this._instructions.shift();
    if (instruction == null) {
      return;
    }

    try {
      switch (instruction.type) {
        case "write":
          const writeResult: Entry<T> = await this._writeEntry(
            instruction.data,
            instruction.time,
            instruction.key
          );
          instruction.resolve(writeResult);
          break;
        case "read":
          const readResult: Entry<T> | undefined = await this._readEntry(
            instruction.key
          );
          instruction.resolve(readResult);
          break;
        case "delete":
          await this._deleteEntry(instruction.key);
          instruction.resolve();
          break;
        case "listEntryKeys":
          const listKeysResult = await this._listRecordKeys(
            instruction.options
          );
          instruction.resolve(listKeysResult);
          break;
        case "listEntries":
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
