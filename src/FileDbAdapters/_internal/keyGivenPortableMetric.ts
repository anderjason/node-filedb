import { PortableMetric } from "../../FileDb/Types";

export function keyGivenPortableMetric(portableMetric: PortableMetric): string {
  return portableMetric.metricKey;
}
