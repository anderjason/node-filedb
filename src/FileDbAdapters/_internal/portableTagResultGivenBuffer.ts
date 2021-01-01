import { PortableValueResult } from "..";
import { PortableTag } from "../../FileDb/Types";
import { ensureValuesExist } from "./ensureValuesExist";

function portableTagGivenVersion3(obj: any): PortableTag {
  ensureValuesExist(obj, "portableTagGivenVersion3", ["key", "entryKeys"]);

  return {
    tagKey: obj.key,
    entryKeys: obj.entryKeys,
  };
}

export function portableTagResultGivenBuffer(
  buffer: Buffer
): PortableValueResult<PortableTag> {
  const obj = JSON.parse(buffer.toString());

  const version = obj.version || 1;

  switch (version) {
    case 3:
      return {
        value: portableTagGivenVersion3(obj),
        shouldRewriteStorage: false,
      };
    default:
      throw new Error("Unsupported version in portableTagResultGivenBuffer");
  }
}
