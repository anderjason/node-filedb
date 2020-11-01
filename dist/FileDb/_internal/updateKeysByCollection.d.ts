import { FileDbAdapter, PortableCollection } from "../../FileDbAdapters";
export declare function updateKeysByCollection(adapter: FileDbAdapter<PortableCollection>, collectionKey: string, keys?: Set<string>): Promise<void>;
