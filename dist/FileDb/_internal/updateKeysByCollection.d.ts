import { PortableCollection } from "..";
import { FileDbAdapter } from "../FileDbAdapter";
export declare function updateKeysByCollection(adapter: FileDbAdapter<PortableCollection>, collectionKey: string, keys?: Set<string>): Promise<void>;
