export declare type MetricValue = number;
export interface PortableTag {
    tagKey: string;
    entryKeys: string[];
}
export interface PortableEntryMetricValues {
    [entryKey: string]: MetricValue;
}
export interface PortableMetric {
    metricKey: string;
    entryMetricValues: PortableEntryMetricValues;
}
export interface PortableEntry {
    entryKey: string;
    createdAtMs: number;
    updatedAtMs: number;
    data: any;
    tagKeys?: string[];
    metricValues?: {
        [metricKey: string]: number;
    };
}
