import { FileDbAdapter, PortableIndex } from "../../FileDbAdapters";
export declare function updateValuesByKeyByIndex(adapter: FileDbAdapter<PortableIndex>, indexKey: string, valuesByKey?: Map<string, number>): Promise<void>;
