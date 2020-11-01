import { UnsaltedHash } from "@anderjason/node-crypto";
import { FileDbAdapter, PortableCollection } from "../../FileDbAdapters";

export async function updateKeysByCollection(
  adapter: FileDbAdapter<PortableCollection>,
  collectionKey: string,
  keys?: Set<string>
): Promise<void> {
  const hash = UnsaltedHash.givenUnhashedString(collectionKey)
    .toHashedString()
    .slice(0, 24);

  if (keys != null && keys.size > 0) {
    const contents = {
      collection: collectionKey,
      keys: Array.from(keys),
    };

    await adapter.setValue(hash, contents);
  } else {
    await adapter.deleteKey(hash);
  }
}
