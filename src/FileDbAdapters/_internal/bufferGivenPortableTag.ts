import { PortableTag } from "../../FileDb/Types";

export function bufferGivenPortableTag(value: PortableTag): Buffer {
  const obj = {
    version: 2,
    ...value,
  };

  return Buffer.from(JSON.stringify(obj));
}
