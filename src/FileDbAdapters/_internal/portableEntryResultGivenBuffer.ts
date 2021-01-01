import { PortableValueResult } from "..";
import { PortableEntry } from "../../FileDb/Types";
import { ensureValuesExist } from "./ensureValuesExist";

function portableEntryGivenVersion1(obj: any): PortableEntry {
  ensureValuesExist(obj, "portableEntryGivenVersion1", [
    "key",
    "createdAtMs",
    "updatedAtMs",
    "data",
    "collections",
    "valuesByIndex",
  ]);

  return {
    entryKey: obj.key,
    createdAtMs: obj.createdAtMs,
    updatedAtMs: obj.updatedAtMs,
    data: obj.data,
    tagKeys: obj.collections,
    metricValues: obj.valuesByIndex,
  };
}

function portableEntryGivenVersion2(obj: any): PortableEntry {
  ensureValuesExist(obj, "portableEntryGivenVersion2", [
    "entryKey",
    "createdAtMs",
    "updatedAtMs",
    "data",
    "tagKeys",
    "metricValues",
  ]);

  return {
    entryKey: obj.entryKey,
    createdAtMs: obj.createdAtMs,
    updatedAtMs: obj.updatedAtMs,
    data: obj.data,
    tagKeys: obj.collections,
    metricValues: obj.valuesByIndex,
  };
}

function portableEntryGivenVersion3(obj: any): PortableEntry {
  ensureValuesExist(obj, "portableEntryGivenVersion2", [
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
    tagKeys: obj.collections,
    metricValues: obj.valuesByIndex,
  };
}

export function portableEntryResultGivenBuffer(
  buffer: Buffer
): PortableValueResult<PortableEntry> {
  const obj = JSON.parse(buffer.toString());

  const version = obj.version || 1;

  switch (version) {
    case 1:
      return {
        value: portableEntryGivenVersion1(obj),
        shouldRewriteStorage: true,
      };
    case 2:
      return {
        value: portableEntryGivenVersion2(obj),
        shouldRewriteStorage: false,
      };
    case 3:
      return {
        value: portableEntryGivenVersion3(obj),
        shouldRewriteStorage: false,
      };
    default:
      throw new Error("Unsupported version in portableEntryResultGivenBuffer");
  }
}
