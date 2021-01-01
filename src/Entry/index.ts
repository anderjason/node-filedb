import { UniqueId } from "@anderjason/node-crypto";
import {
  Dict,
  Observable,
  ObservableDict,
  ObservableSet,
} from "@anderjason/observable";
import { Instant } from "@anderjason/time";
import { PropsObject } from "../PropsObject";

export interface EntryProps<T> {
  entryKey?: string;
  data?: T;
  createdAt?: Instant;
  updatedAt?: Instant;
  tagKeys?: Set<string>;
  metricValues?: Dict<number>;
}

export class Entry<T> extends PropsObject<EntryProps<T>> {
  readonly entryKey: string;
  readonly tagKeys = ObservableSet.ofEmpty<string>();
  readonly metricValues = ObservableDict.ofEmpty<number>();
  readonly createdAt = Observable.ofEmpty<Instant>();
  readonly updatedAt = Observable.ofEmpty<Instant>();
  readonly data = Observable.ofEmpty<T>();

  constructor(props: EntryProps<T>) {
    super(props);

    this.entryKey = props.entryKey || UniqueId.ofRandom().toUUIDString();
    this.data.setValue(props.data);
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

  toObject(): any {
    return {
      entryKey: this.entryKey,
      tagKeys: this.tagKeys.toArray(),
      metricValues: this.metricValues.toValues(),
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
      data: this.data.value,
    };
  }
}
