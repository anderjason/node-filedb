import { UniqueId } from "@anderjason/node-crypto";
import {
  Dict,
  Observable,
  ObservableDict,
  ObservableSet,
} from "@anderjason/observable";
import { Instant } from "@anderjason/time";
import { PropsObject } from "../../PropsObject";

export interface DbRecordProps<T> {
  recordKey?: string;
  recordData?: T;
  createdAt?: Instant;
  updatedAt?: Instant;
  tagKeys?: Set<string>;
  metricValues?: Dict<number>;
}

export class DbRecord<T> extends PropsObject<DbRecordProps<T>> {
  readonly recordKey: string;
  readonly tagKeys = ObservableSet.ofEmpty<string>();
  readonly metricValues = ObservableDict.ofEmpty<number>();
  readonly createdAt = Observable.ofEmpty<Instant>();
  readonly updatedAt = Observable.ofEmpty<Instant>();
  readonly recordData = Observable.ofEmpty<T>();

  constructor(props: DbRecordProps<T>) {
    super(props);

    this.recordKey = props.recordKey || UniqueId.ofRandom().toUUIDString();
    this.recordData.setValue(props.recordData);
    this.createdAt.setValue(props.createdAt || Instant.ofNow());
    this.updatedAt.setValue(
      props.updatedAt || props.createdAt || Instant.ofNow()
    );

    if (this.props.tagKeys != null) {
      this.tagKeys.sync(this.props.tagKeys);
    }

    if (this.props.metricValues != null) {
      this.metricValues.sync(this.props.metricValues);
    }
  }
}
