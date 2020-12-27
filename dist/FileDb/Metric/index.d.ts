import { ObservableDict } from "@anderjason/observable";
import { FileDbAdapter, PortableMetric } from "../../FileDbAdapters";
import { PropsObject } from "../../PropsObject";
export interface MetricProps {
    metricKey: string;
    adapter: FileDbAdapter<PortableMetric>;
}
export declare class Metric extends PropsObject<MetricProps> {
    readonly recordMetricValues: ObservableDict<number>;
    load(): Promise<void>;
    save(): Promise<void>;
}
