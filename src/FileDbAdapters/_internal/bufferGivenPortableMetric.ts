import { PortableMetric } from "../../FileDb/Types";

export function bufferGivenPortableMetric(value: PortableMetric): Buffer {
  const obj = {
    version: 3,
    key: value.metricKey,
    ...value,
  };
  delete obj.metricKey;

  return Buffer.from(JSON.stringify(obj));
}
