import { PortableTag } from "../../FileDb/Types";

export function bufferGivenPortableTag(value: PortableTag): Buffer {
  const obj = {
    version: 3,
    key: value.tagKey,
    ...value,
  };
  delete obj.tagKey;

  return Buffer.from(JSON.stringify(obj));
}
