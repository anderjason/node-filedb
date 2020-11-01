export interface FileDbAdapter<T> {
    toKeys(): Promise<string[]>;
    toValues(): Promise<T[]>;
    toOptionalValue(key: string): Promise<T>;
    setValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
}
