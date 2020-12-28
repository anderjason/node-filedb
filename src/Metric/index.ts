import { UnsaltedHash } from "@anderjason/node-crypto";
import { ObservableDict } from "@anderjason/observable";
import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableEntryMetricValues, PortableMetric } from "../FileDb/Types";

export interface MetricProps {
  metricKey: string;
  adapter: FileDbAdapter<PortableMetric>;
}

export class Metric extends PropsObject<MetricProps> {
  readonly entryMetricValues = ObservableDict.ofEmpty<number>();

  async load() {
    const portableMetric = await this.props.adapter.toOptionalValueGivenKey(
      this.props.metricKey
    );

    this.entryMetricValues.sync(portableMetric.entryMetricValues);
  }

  async save(): Promise<void> {
    const hash = UnsaltedHash.givenUnhashedString(this.props.metricKey)
      .toHashedString()
      .slice(0, 24);

    if (this.entryMetricValues.count > 0) {
      const entryMetricValues: PortableEntryMetricValues = {};

      this.entryMetricValues.toKeys().forEach((entryKey) => {
        entryMetricValues[
          entryKey
        ] = this.entryMetricValues.toOptionalValueGivenKey(entryKey);
      });

      const contents = {
        metricKey: this.props.metricKey,
        entryMetricValues,
      };

      await this.props.adapter.writeValue(hash, contents);
    } else {
      await this.props.adapter.deleteKey(hash);
    }
  }
}
