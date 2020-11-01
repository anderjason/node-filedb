import { FileDbAdapter, PortableCollection } from "../../FileDbAdapters";
export declare function keysByCollectionGivenAdapter(collectionsAdapter: FileDbAdapter<PortableCollection>): Promise<Map<string, Set<string>>>;
