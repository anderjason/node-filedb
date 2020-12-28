import { ObservableDict } from "@anderjason/observable";
import { FileDbAdapter } from "../../FileDbAdapters";
import { PropsObject } from "../../PropsObject";
import { PortableMetric } from "../Types";
export interface MetricProps {
    metricKey: string;
    adapter: FileDbAdapter<PortableMetric>;
}
export declare class Metric extends PropsObject<MetricProps> {
    readonly entryMetricValues: ObservableDict<number>;
    load(): Promise<void>;
    save(): Promise<void>;
}
