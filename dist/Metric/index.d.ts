import { ObservableDict } from "@anderjason/observable";
import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableMetric } from "../FileDb/Types";
export interface MetricProps {
    metricKey: string;
    adapter: FileDbAdapter<PortableMetric>;
}
export declare class Metric extends PropsObject<MetricProps> {
    readonly metricKey: string;
    readonly entryMetricValues: ObservableDict<number>;
    constructor(props: MetricProps);
    load(): Promise<void>;
    save(): Promise<void>;
}
