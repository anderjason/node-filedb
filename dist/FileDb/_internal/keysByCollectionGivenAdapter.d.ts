import { PortableCollection } from "..";
import { FileDbAdapter } from "../FileDbAdapter";
export declare function keysByCollectionGivenAdapter(collectionsAdapter: FileDbAdapter<PortableCollection>): Promise<Map<string, Set<string>>>;
