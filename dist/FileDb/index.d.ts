import { Actor } from "skytree";
import { Metric } from "./Metric";
import { Tag } from "./Tag";
import { Entry } from "./Entry";
import { FileDbAdapters } from "../FileDbAdapters";
import { Dict, ReadOnlyObservable } from "@anderjason/observable";
export interface FileDbReadOptions {
    requireTagKeys?: string[];
    orderByMetricKey?: string;
    limit?: number;
    offset?: number;
}
export interface FileDbProps<T> {
    adapters: FileDbAdapters;
    tagKeysGivenEntryData: (data: T) => Set<string>;
    metricsGivenEntryData: (data: T) => Dict<number>;
    cacheSize?: number;
}
export declare class FileDb<T> extends Actor<FileDbProps<T>> {
    private _isReady;
    readonly isReady: ReadOnlyObservable<boolean>;
    private _entryCache;
    private _tags;
    private _metrics;
    private _allEntryKeys;
    private _instructions;
    constructor(props: FileDbProps<T>);
    onActivate(): void;
    get tags(): Tag[];
    get metrics(): Metric[];
    private load;
    toEntryKeys(options?: FileDbReadOptions): Promise<string[]>;
    hasEntry(entryKey: string): Promise<boolean>;
    toEntryCount(requireTagKeys?: string[]): Promise<number>;
    toEntries(options?: FileDbReadOptions): Promise<Entry<T>[]>;
    toOptionalFirstEntry(options?: FileDbReadOptions): Promise<Entry<T> | undefined>;
    toEntryGivenKey(entryKey: string): Promise<Entry<T>>;
    toOptionalEntryGivenKey(entryKey: string): Promise<Entry<T> | undefined>;
    writeEntry(entryData: T, entryKey?: string): Promise<Entry<T>>;
    deleteEntryKey(entryKey: string): Promise<void>;
    ensureReady(): Promise<void>;
    private _deleteEntry;
    private _readEntry;
    private _writeEntry;
    private _listRecordKeys;
    private _listRecords;
    private _nextInstruction;
}
