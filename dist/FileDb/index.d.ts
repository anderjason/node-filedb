import { Actor } from "skytree";
import { Instant } from "@anderjason/time";
import { FileDbAdapters } from "../FileDbAdapters";
import { ReadOnlyObservable } from "@anderjason/observable";
export interface FileDbRow<T> {
    key: string;
    createdAt: Instant;
    updatedAt: Instant;
    data: T;
    collections: Set<string>;
    valuesByIndex: Map<string, number>;
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
export interface FileDbProps<T> {
    adapters: FileDbAdapters;
    collectionsGivenData: (data: T) => Set<string>;
    valuesByIndexGivenData: (data: T) => Map<string, number>;
    cacheSize?: number;
}
export declare class FileDb<T> extends Actor<FileDbProps<T>> {
    private _isReady;
    readonly isReady: ReadOnlyObservable<boolean>;
    private _rowCache;
    private _keysByCollection;
    private _valuesByKeyByIndex;
    private _allKeys;
    private _instructions;
    constructor(props: FileDbProps<T>);
    onActivate(): void;
    toCollections(): Promise<string[]>;
    toKeys(options?: FileDbReadOptions): Promise<string[]>;
    hasKey(key: string): Promise<boolean>;
    toCount(filter?: string[]): Promise<number>;
    toRows(options?: FileDbReadOptions): Promise<FileDbRow<T>[]>;
    toOptionalFirstRow(options?: FileDbReadOptions): Promise<FileDbRow<T> | undefined>;
    toRow(key: string): Promise<FileDbRow<T>>;
    toOptionalRowGivenKey(key: string): Promise<FileDbRow<T> | undefined>;
    writeRow(data: T, key?: string): Promise<FileDbRow<T>>;
    deleteKey(key: string): Promise<void>;
    private _delete;
    private _read;
    private _write;
    private _listKeys;
    private _listRows;
    private _nextInstruction;
}
