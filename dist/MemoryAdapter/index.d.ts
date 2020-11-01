import { FileDbAdapter } from "../FileDb/FileDbAdapter";
export declare class MemoryAdapter<T> implements FileDbAdapter<T> {
    private _data;
    toKeys(): Promise<string[]>;
    toValues(): Promise<T[]>;
    toOptionalValue(key: string): Promise<T>;
    setValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
}
