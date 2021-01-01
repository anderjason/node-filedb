import { PortableValueResult } from "..";
import { PortableEntry } from "../../FileDb/Types";
import { ensureValuesExist } from "./ensureValuesExist";

function portableEntryGivenVersion3(obj: any): PortableEntry {
  ensureValuesExist(obj, "portableEntryGivenVersion3", [
    "key",
    "createdAtMs",
    "updatedAtMs",
    "data",
    "tagKeys",
    "metricValues",
  ]);

  return {
    entryKey: obj.key,
    createdAtMs: obj.createdAtMs,
    updatedAtMs: obj.updatedAtMs,
    data: obj.data,
    tagKeys: obj.tagKeys,
    metricValues: obj.metricValues,
  };
}

export function portableEntryResultGivenBuffer(
  buffer: Buffer
): PortableValueResult<PortableEntry> {
  const obj = JSON.parse(buffer.toString());

  const version = obj.version || 1;

  switch (version) {
    case 3:
      return {
        value: portableEntryGivenVersion3(obj),
        shouldRewriteStorage: false,
      };
    default:
      throw new Error("Unsupported version in portableEntryResultGivenBuffer");
  }
}
