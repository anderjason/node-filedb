/// <reference types="node" />
import { LocalDirectory, LocalFile } from "@anderjason/node-filesystem";
import { ReadOnlyObservable } from "@anderjason/observable";
import { Actor } from "skytree";
import { FileDbAdapter, PortableValueResult } from "../FileDbAdapters";
export interface LocalFileAdapterProps<T> {
    directory: LocalDirectory;
    valueGivenBuffer: (buffer: Buffer) => PortableValueResult<T>;
    keyGivenValue: (value: T) => string;
    bufferGivenValue: (value: T) => Buffer;
}
export declare class LocalFileAdapter<T> extends Actor<LocalFileAdapterProps<T>> implements FileDbAdapter<T> {
    private _keys;
    private _isReady;
    readonly isReady: ReadOnlyObservable<boolean>;
    private writeKeyCacheLater;
    onActivate(): void;
    toKeys(): Promise<string[]>;
    private get keyCacheFile();
    private load;
    toValues(): Promise<T[]>;
    toOptionalValueGivenKey(key: string): Promise<T>;
    writeValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
    private getDataFiles;
    private oldFileGivenKey;
    private oldFile2GivenKey;
    private newFileGivenKey;
    fileGivenKey(key: string): Promise<LocalFile>;
}
