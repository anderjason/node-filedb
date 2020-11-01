import { FileDbAdapter, PortableIndex } from "../FileDbAdapter";
export async function updateValuesByKeyByIndex(
  adapter: FileDbAdapter<PortableIndex>,
  indexKey: string,
  valuesByKey?: Map<string, number>
): Promise<void> {
  if (valuesByKey != null && valuesByKey.size > 0) {
    const obj: any = {};
    for (let [key, value] of valuesByKey) {
      obj[key] = value;
    }

    const contents = {
      index: indexKey,
      valuesByKey: obj,
    };

    await adapter.setValue(indexKey, contents);
  } else {
    await adapter.deleteKey(indexKey);
  }
}
