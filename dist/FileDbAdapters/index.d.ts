import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
export declare type MetricValue = number;
export interface FileDbAdapter<T> extends Actor {
    toKeys(): Promise<string[]>;
    toValues(): Promise<T[]>;
    toOptionalValueGivenKey(key: string): Promise<T>;
    writeValue(key: string, value: T): Promise<void>;
    deleteKey(key: string): Promise<void>;
}
export interface PortableTag {
    tagKey: string;
    recordKeys: string[];
}
export interface PortableRecordMetricValues {
    [recordKey: string]: MetricValue;
}
export interface PortableMetric {
    metricKey: string;
    recordMetricValues: PortableRecordMetricValues;
}
export interface PortableRecord {
    recordKey: string;
    createdAtMs: number;
    updatedAtMs: number;
    data: any;
    tagKeys?: string[];
    metricValues?: {
        [metricKey: string]: number;
    };
}
interface FileDbAdaptersProps {
    tagsAdapter: FileDbAdapter<PortableTag>;
    recordsAdapter: FileDbAdapter<PortableRecord>;
    metricsAdapter: FileDbAdapter<PortableMetric>;
}
export declare class FileDbAdapters extends Actor<FileDbAdaptersProps> {
    static ofMemory(): FileDbAdapters;
    static givenDirectory(directory: LocalDirectory): FileDbAdapters;
    onActivate(): void;
}
export {};
