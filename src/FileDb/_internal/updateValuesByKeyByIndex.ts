import { UnsaltedHash } from "@anderjason/node-crypto";
import { FileDbAdapter, PortableIndex } from "../../FileDbAdapters";
export async function updateValuesByKeyByIndex(
  adapter: FileDbAdapter<PortableIndex>,
  indexKey: string,
  valuesByKey?: Map<string, number>
): Promise<void> {
  const hash = UnsaltedHash.givenUnhashedString(indexKey)
    .toHashedString()
    .slice(0, 24);

  if (valuesByKey != null && valuesByKey.size > 0) {
    const obj: any = {};
    for (let [key, value] of valuesByKey) {
      obj[key] = value;
    }

    const contents = {
      index: indexKey,
      valuesByKey: obj,
    };

    await adapter.setValue(hash, contents);
  } else {
    await adapter.deleteKey(hash);
  }
}
