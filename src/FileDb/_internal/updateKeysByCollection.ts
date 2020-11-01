import { FileDbAdapter, PortableCollection } from "../../FileDbAdapters";

export async function updateKeysByCollection(
  adapter: FileDbAdapter<PortableCollection>,
  collectionKey: string,
  keys?: Set<string>
): Promise<void> {
  if (keys != null && keys.size > 0) {
    const contents = {
      collection: collectionKey,
      keys: Array.from(keys),
    };

    await adapter.setValue(collectionKey, contents);
  } else {
    await adapter.deleteKey(collectionKey);
  }
}
