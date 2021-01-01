import { PortableValueResult } from "..";
import { PortableEntry } from "../../FileDb/Types";
import { ensureValuesExist } from "./ensureValuesExist";

function portableEntryGivenVersion1(was: any): PortableEntry {
  ensureValuesExist(was, "portableEntryGivenVersion1", [
    "key",
    "createdAtMs",
    "updatedAtMs",
    "data",
    "collections",
    "valuesByIndex",
  ]);

  return {
    entryKey: was.key,
    createdAtMs: was.createdAtMs,
    updatedAtMs: was.updatedAtMs,
    data: was.data,
    tagKeys: was.collections,
    metricValues: was.valuesByIndex,
  };
}

function portableEntryGivenVersion2(was: any): PortableEntry {
  ensureValuesExist(was, "portableEntryGivenVersion2", [
    "entryKey",
    "createdAtMs",
    "updatedAtMs",
    "data",
    "tagKeys",
    "metricValues",
  ]);

  return {
    entryKey: was.entryKey,
    createdAtMs: was.createdAtMs,
    updatedAtMs: was.updatedAtMs,
    data: was.data,
    tagKeys: was.collections,
    metricValues: was.valuesByIndex,
  };
}

function portableEntryGivenVersion3(was: any): PortableEntry {
  ensureValuesExist(was, "portableEntryGivenVersion3", [
    "key",
    "createdAtMs",
    "updatedAtMs",
    "data",
    "tagKeys",
    "metricValues",
  ]);

  return {
    entryKey: was.key,
    createdAtMs: was.createdAtMs,
    updatedAtMs: was.updatedAtMs,
    data: was.data,
    tagKeys: was.tagKeys,
    metricValues: was.metricValues,
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
