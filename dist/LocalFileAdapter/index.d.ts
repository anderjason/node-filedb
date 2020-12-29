/// <reference types="node" />
import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
import { FileDbAdapter, PortableValueResult } from "../FileDbAdapters";
export interface LocalFileAdapterProps<T> {
    directory: LocalDirectory;
    valueGivenBuffer: (buffer: Buffer) => PortableValueResult<T>;
    keyGivenValue: (value: T) => string;
    bufferGivenValue: (value: T) => Buffer;
}
export declare class LocalFileAdapter<T> extends Actor<LocalFileAdapterProps<T>> implements FileDbAdapter<T> {
    toKeys(): Promise<string[]>;
    toValues(): Promise<T[]>;
    toOptionalValueGivenKey(key: string): Promise<T>;
    writeValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
    private oldFileGivenKey;
    private oldFile2GivenKey;
    private newFileGivenKey;
    private fileGivenKey;
}
