import { FileDbAdapter, PortableCollection } from "../../FileDbAdapters";

export async function keysByCollectionGivenAdapter(
  collectionsAdapter: FileDbAdapter<PortableCollection>
): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>();

  const collections = await collectionsAdapter.toValues();

  collections.forEach((collection) => {
    result.set(collection.collection, new Set(collection.keys));
  });

  return result;
}
