import { PortableIndex } from "..";
import { FileDbAdapter } from "../FileDbAdapter";
export declare function updateValuesByKeyByIndex(adapter: FileDbAdapter<PortableIndex>, indexKey: string, valuesByKey?: Map<string, number>): Promise<void>;
