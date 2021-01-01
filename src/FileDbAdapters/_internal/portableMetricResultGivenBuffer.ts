import { PortableValueResult } from "..";
import { PortableEntry, PortableMetric, PortableTag } from "../../FileDb/Types";
import { ensureValuesExist } from "./ensureValuesExist";

function portableMetricGivenVersion3(obj: any): PortableMetric {
  ensureValuesExist(obj, "portableMetricGivenVersion3", [
    "key",
    "entryMetricValues",
  ]);

  return {
    key: obj.key,
    entryMetricValues: obj.entryMetricValues,
  };
}

export function portableMetricResultGivenBuffer(
  buffer: Buffer
): PortableValueResult<PortableMetric> {
  const obj = JSON.parse(buffer.toString());

  const version = obj.version || 1;

  switch (version) {
    case 3:
      return {
        value: portableMetricGivenVersion3(obj),
        shouldRewriteStorage: false,
      };
    default:
      throw new Error("Unsupported version in portableMetricResultGivenBuffer");
  }
}
