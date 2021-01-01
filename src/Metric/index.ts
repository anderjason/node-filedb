import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableMetric } from "../FileDb/Types";
import { Dict } from "@anderjason/observable";

export interface MetricProps {
  metricKey: string;
  adapter: FileDbAdapter<PortableMetric>;
}

export class Metric extends PropsObject<MetricProps> {
  readonly key: string;
  entryMetricValues: Dict<number> = {};

  constructor(props: MetricProps) {
    super(props);

    if (props.metricKey == null) {
      throw new Error("metricKey is required");
    }

    if (props.adapter == null) {
      throw new Error("adapter is required");
    }

    this.key = props.metricKey;
  }

  toOptionalValueGivenEntryKey(entryKey: string): number | undefined {
    if (this.entryMetricValues == null) {
      return undefined;
    }

    return this.entryMetricValues[entryKey];
  }

  setEntryMetricValue(entryKey: string, value: number): void {
    if (this.entryMetricValues == null) {
      this.entryMetricValues = {};
    }

    this.entryMetricValues[entryKey] = value;
  }

  hasValueGivenEntryKey(entryKey: string): boolean {
    return this.toOptionalValueGivenEntryKey(entryKey) != null;
  }

  removeValueGivenEntryKey(metricKey: string): void {
    if (this.entryMetricValues == null) {
      return;
    }

    delete this.entryMetricValues[metricKey];
  }

  async load() {
    const portableMetric = await this.props.adapter.toOptionalValueGivenKey(
      this.props.metricKey
    );

    if (portableMetric == null) {
      throw new Error(
        `Metrics adapter returned null for metricKey '${this.props.metricKey}'`
      );
    }

    this.entryMetricValues = portableMetric.entryMetricValues || {};
  }

  async save(): Promise<void> {
    if (this.entryMetricValues.count > 0) {
      await this.props.adapter.writeValue(
        this.props.metricKey,
        this.toPortableObject()
      );
    } else {
      await this.props.adapter.deleteKey(this.props.metricKey);
    }
  }

  toPortableObject(): PortableMetric {
    return {
      key: this.key,
      entryMetricValues: this.entryMetricValues || {},
    };
  }
}
