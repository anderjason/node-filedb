import { Actor } from "skytree";
import { PortableKeyObject } from "../FileDb/Types";
import { FileDbAdapter } from "../FileDbAdapters";
export declare class MemoryAdapter<T extends PortableKeyObject> extends Actor<void> implements FileDbAdapter<T> {
    private _data;
    toKeys(): Promise<string[]>;
    toValues(): Promise<T[]>;
    toOptionalValueGivenKey(key: string): Promise<T>;
    writeValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
    rebuild(): Promise<void>;
}
