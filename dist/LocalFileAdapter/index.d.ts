/// <reference types="node" />
import { LocalDirectory } from "@anderjason/node-filesystem";
import { ReadOnlyObservable } from "@anderjason/observable";
import { Actor } from "skytree";
import { PortableKeyObject } from "../FileDb/Types";
import { FileDbAdapter, PortableValueResult } from "../FileDbAdapters";
export interface LocalFileAdapterProps<T> {
    directory: LocalDirectory;
    valueGivenBuffer: (buffer: Buffer) => PortableValueResult<T>;
    bufferGivenValue: (value: T) => Buffer;
}
export declare class LocalFileAdapter<T extends PortableKeyObject> extends Actor<LocalFileAdapterProps<T>> implements FileDbAdapter<T> {
    private _keys;
    private _isReady;
    readonly isReady: ReadOnlyObservable<boolean>;
    onActivate(): void;
    toKeys(): Promise<string[]>;
    private load;
    toValues(): Promise<T[]>;
    toOptionalValueGivenKey(key: string): Promise<T>;
    writeValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
    private getDataFiles;
    private fileGivenKey;
    rebuild(): Promise<void>;
}
