import { PortableEntry } from "../../FileDb/Types";

export function bufferGivenPortableEntry(value: PortableEntry): Buffer {
  const obj = {
    version: 3,
    key: value.entryKey,
    ...value,
  };
  delete obj.entryKey;

  return Buffer.from(JSON.stringify(obj, null, 2));
}
