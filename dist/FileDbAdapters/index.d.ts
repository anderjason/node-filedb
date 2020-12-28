import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
import { PortableTag, PortableEntry, PortableMetric } from "../FileDb/Types";
export interface PortableValueResult<T> {
    value: T;
    shouldRewriteStorage: boolean;
}
export interface FileDbAdapter<T> extends Actor {
    toKeys(): Promise<string[]>;
    toValues(): Promise<T[]>;
    toOptionalValueGivenKey(key: string): Promise<T>;
    writeValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
}
interface FileDbAdaptersProps {
    tagsAdapter: FileDbAdapter<PortableTag>;
    entriesAdapter: FileDbAdapter<PortableEntry>;
    metricsAdapter: FileDbAdapter<PortableMetric>;
}
export declare class FileDbAdapters extends Actor<FileDbAdaptersProps> {
    static ofMemory(): FileDbAdapters;
    static givenDirectory(directory: LocalDirectory): FileDbAdapters;
    onActivate(): void;
}
export {};
