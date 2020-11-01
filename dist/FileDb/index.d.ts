import { Actor } from "skytree";
import { LocalDirectory } from "@anderjason/node-filesystem";
import { Instant } from "@anderjason/time";
import { FileDbAdapters } from "../FileDbAdapters";
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
    label: string;
    adapters: FileDbAdapters;
    collectionsGivenData: (data: T) => Set<string>;
    valuesByIndexGivenData: (data: T) => Map<string, number>;
    cacheSize?: number;
}
export declare class FileDb<T> extends Actor<FileDbProps<T>> {
    readonly directory: LocalDirectory;
    readonly label: string;
    private _rowCache;
    private _keysByCollection;
    private _valuesByKeyByIndex;
    private _allKeys;
    private _instructions;
    constructor(props: FileDbProps<T>);
    onActivate(): void;
    toCollections(): string[];
    toKeys(options?: FileDbReadOptions): Promise<string[]>;
    hasKey(key: string): Promise<boolean>;
    toCount(filter?: string[]): Promise<number>;
    toRows(options?: FileDbReadOptions): Promise<FileDbRow<T>[]>;
    toOptionalFirstRow(options?: FileDbReadOptions): Promise<FileDbRow<T> | undefined>;
    toRowGivenKey(key: string): Promise<FileDbRow<T>>;
    toOptionalRowGivenKey(key: string): Promise<FileDbRow<T> | undefined>;
    toWritePromise(data: T, key?: string): Promise<FileDbRow<T>>;
    toDeletePromise: (key: string) => Promise<void>;
    private _delete;
    private _read;
    private _write;
    private _listKeys;
    private _listRows;
    private _nextInstruction;
}
