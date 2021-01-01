export type MetricValue = number;

export interface PortableKeyObject {
  readonly key: string;
}

export interface PortableTag extends PortableKeyObject {
  entryKeys: string[];
}

export interface PortableEntryMetricValues {
  [entryKey: string]: MetricValue;
}

export interface PortableMetric extends PortableKeyObject {
  entryMetricValues: PortableEntryMetricValues;
}

export interface PortableEntry extends PortableKeyObject {
  createdAtMs: number;
  updatedAtMs: number;
  data: any;

  tagKeys?: string[];
  metricValues?: {
    [metricKey: string]: number;
  };
}
