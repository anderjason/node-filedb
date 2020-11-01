import { FileDbAdapter } from "../FileDbAdapter";

export async function valuesByKeyByIndexGivenAdapter(
  adapter: FileDbAdapter<any>
): Promise<Map<string, Map<string, number>>> {
  const result = new Map<string, Map<string, number>>();

  const indexes = await adapter.toValues();

  indexes.forEach((index) => {
    const valuesByKey = new Map<string, number>(
      Object.entries(index.valuesByKey)
    );

    result.set(index.index, valuesByKey);
  });

  return result;
}
