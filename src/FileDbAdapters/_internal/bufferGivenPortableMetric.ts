import { PortableMetric } from "../../FileDb/Types";

export function bufferGivenPortableMetric(value: PortableMetric): Buffer {
  const obj = {
    version: 3,
    ...value,
  };

  return Buffer.from(JSON.stringify(obj));
}
