import { Actor } from "skytree";
import { Metric } from "./Metric";
import { Tag } from "./Tag";
import { FileDbAdapters } from "../FileDbAdapters";
import { Dict, ReadOnlyObservable } from "@anderjason/observable";
import { DbRecord } from "./DbRecord";
export interface FileDbReadOptions {
    requireTagKeys?: string[];
    orderByMetricKey?: string;
    limit?: number;
    offset?: number;
}
export interface FileDbProps<T> {
    adapters: FileDbAdapters;
    tagKeysGivenRecordData: (data: T) => Set<string>;
    metricsGivenRecordData: (data: T) => Dict<number>;
    cacheSize?: number;
}
export declare class FileDb<T> extends Actor<FileDbProps<T>> {
    private _isReady;
    readonly isReady: ReadOnlyObservable<boolean>;
    private _recordCache;
    private _tags;
    private _metrics;
    private _allRecordKeys;
    private _instructions;
    constructor(props: FileDbProps<T>);
    onActivate(): void;
    get tags(): Tag[];
    get metrics(): Metric[];
    private load;
    toRecordKeys(options?: FileDbReadOptions): Promise<string[]>;
    hasRecord(recordKey: string): Promise<boolean>;
    toRecordCount(requireTagKeys?: string[]): Promise<number>;
    toRecords(options?: FileDbReadOptions): Promise<DbRecord<T>[]>;
    toOptionalFirstRecord(options?: FileDbReadOptions): Promise<DbRecord<T> | undefined>;
    toRecordGivenKey(recordKey: string): Promise<DbRecord<T>>;
    toOptionalRecordGivenKey(recordKey: string): Promise<DbRecord<T> | undefined>;
    writeRecord(recordData: T, recordKey?: string): Promise<DbRecord<T>>;
    deleteKey(recordKey: string): Promise<void>;
    ensureReady(): Promise<void>;
    private _deleteRecord;
    private _readRecord;
    private _writeRecord;
    private _listRecordKeys;
    private _listRecords;
    private _nextInstruction;
}
