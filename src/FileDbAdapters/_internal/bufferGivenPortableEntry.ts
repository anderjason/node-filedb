import { PortableEntry } from "../../FileDb/Types";

export function bufferGivenPortableEntry(value: PortableEntry): Buffer {
  const obj = {
    version: 2,
    ...value,
  };

  return Buffer.from(JSON.stringify(obj));
}
