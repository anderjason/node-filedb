import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableMetric } from "../FileDb/Types";
import { Dict } from "@anderjason/observable";
export interface MetricProps {
    metricKey: string;
    adapter: FileDbAdapter<PortableMetric>;
}
export declare class Metric extends PropsObject<MetricProps> {
    readonly key: string;
    entryMetricValues: Dict<number>;
    constructor(props: MetricProps);
    toOptionalValueGivenEntryKey(entryKey: string): number | undefined;
    setEntryMetricValue(entryKey: string, value: number): void;
    hasValueGivenEntryKey(entryKey: string): boolean;
    removeValueGivenEntryKey(metricKey: string): void;
    load(): Promise<void>;
    save(): Promise<void>;
    toPortableObject(): PortableMetric;
}
