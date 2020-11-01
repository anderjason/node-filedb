import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
export interface FileDbAdapter<T> extends Actor {
    toKeys(): Promise<string[]>;
    toValues(): Promise<T[]>;
    toOptionalValue(key: string): Promise<T>;
    setValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
}
export interface PortableCollection {
    collection: string;
    keys: string[];
}
export interface PortableIndex {
    index: string;
    valuesByKey: {
        [key: string]: number;
    };
}
export interface PortableRow {
    key: string;
    createdAtMs: number;
    updatedAtMs: number;
    data: any;
    collections?: string[];
    valuesByIndex?: {
        [index: string]: number;
    };
}
interface FileDbAdaptersProps {
    collectionsAdapter: FileDbAdapter<PortableCollection>;
    dataAdapter: FileDbAdapter<PortableRow>;
    indexesAdapter: FileDbAdapter<PortableIndex>;
}
export declare class FileDbAdapters extends Actor<FileDbAdaptersProps> {
    static ofMemory(): FileDbAdapters;
    static givenDirectory(directory: LocalDirectory): FileDbAdapters;
    onActivate(): void;
}
export {};
