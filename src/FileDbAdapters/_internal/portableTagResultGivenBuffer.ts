import { PortableValueResult } from "..";
import { PortableTag } from "../../FileDb/Types";
import { ensureValuesExist } from "./ensureValuesExist";

function portableTagGivenVersion1(obj: any): PortableTag {
  ensureValuesExist(obj, "portableTagGivenVersion1", ["collection", "keys"]);

  return {
    tagKey: obj.collection,
    entryKeys: obj.keys,
  };
}

function portableTagGivenVersion2(obj: any): PortableTag {
  ensureValuesExist(obj, "portableTagGivenVersion2", ["tagKey", "entryKeys"]);

  return {
    tagKey: obj.collection,
    entryKeys: obj.keys,
  };
}

export function portableTagResultGivenBuffer(
  buffer: Buffer
): PortableValueResult<PortableTag> {
  const obj = JSON.parse(buffer.toString());

  const version = obj.version || 1;

  switch (version) {
    case 1:
      return {
        value: portableTagGivenVersion1(obj),
        shouldRewriteStorage: true,
      };
    case 2:
      return {
        value: portableTagGivenVersion2(obj),
        shouldRewriteStorage: false,
      };
    default:
      throw new Error("Unsupported version in portableTagResultGivenBuffer");
  }
}
