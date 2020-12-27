import { UnsaltedHash } from "@anderjason/node-crypto";
import { ObservableDict } from "@anderjason/observable";
import {
  FileDbAdapter,
  PortableMetric,
  PortableRecordMetricValues,
} from "../../FileDbAdapters";
import { PropsObject } from "../../PropsObject";

export interface MetricProps {
  metricKey: string;
  adapter: FileDbAdapter<PortableMetric>;
}

export class Metric extends PropsObject<MetricProps> {
  readonly recordMetricValues = ObservableDict.ofEmpty<number>();

  async load() {
    const portableMetric = await this.props.adapter.toOptionalValueGivenKey(
      this.props.metricKey
    );

    this.recordMetricValues.sync(portableMetric.recordMetricValues);
  }

  async save(): Promise<void> {
    const hash = UnsaltedHash.givenUnhashedString(this.props.metricKey)
      .toHashedString()
      .slice(0, 24);

    if (this.recordMetricValues.count > 0) {
      const recordMetricValues: PortableRecordMetricValues = {};

      this.recordMetricValues.toKeys().forEach((recordKey) => {
        recordMetricValues[
          recordKey
        ] = this.recordMetricValues.toOptionalValueGivenKey(recordKey);
      });

      const contents = {
        metricKey: this.props.metricKey,
        recordMetricValues,
      };

      await this.props.adapter.writeValue(hash, contents);
    } else {
      await this.props.adapter.deleteKey(hash);
    }
  }
}
