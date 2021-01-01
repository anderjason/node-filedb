import { PortableValueResult } from "..";
import { PortableEntry, PortableMetric, PortableTag } from "../../FileDb/Types";
import { ensureValuesExist } from "./ensureValuesExist";

function portableMetricGivenVersion1(obj: any): PortableMetric {
  ensureValuesExist(obj, "portableMetricGivenVersion1", [
    "index",
    "valuesByKey",
  ]);

  return {
    metricKey: obj.index,
    entryMetricValues: obj.valuesByKey,
  };
}

function portableMetricGivenVersion2(obj: any): PortableMetric {
  ensureValuesExist(obj, "portableMetricGivenVersion2", [
    "metricKey",
    "entryMetricValues",
  ]);

  return {
    metricKey: obj.metricKey,
    entryMetricValues: obj.valuesByKey,
  };
}

function portableMetricGivenVersion3(obj: any): PortableMetric {
  ensureValuesExist(obj, "portableMetricGivenVersion2", [
    "key",
    "entryMetricValues",
  ]);

  return {
    metricKey: obj.key,
    entryMetricValues: obj.entryMetricValues,
  };
}

export function portableMetricResultGivenBuffer(
  buffer: Buffer
): PortableValueResult<PortableMetric> {
  const obj = JSON.parse(buffer.toString());

  const version = obj.version || 1;

  switch (version) {
    case 1:
      return {
        value: portableMetricGivenVersion1(obj),
        shouldRewriteStorage: true,
      };
    case 2:
      return {
        value: portableMetricGivenVersion2(obj),
        shouldRewriteStorage: false,
      };
    case 3:
      return {
        value: portableMetricGivenVersion3(obj),
        shouldRewriteStorage: false,
      };
    default:
      throw new Error("Unsupported version in portableMetricResultGivenBuffer");
  }
}
