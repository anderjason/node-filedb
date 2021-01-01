import { UniqueId } from "@anderjason/node-crypto";
import { Dict } from "@anderjason/observable";
import { Instant } from "@anderjason/time";
import { PortableEntry, PortableEntryMetricValues } from "../FileDb/Types";
import { PropsObject } from "../PropsObject";

export interface EntryProps<T> {
  key?: string;
  data?: T;
  createdAt?: Instant;
  updatedAt?: Instant;
  tagKeys?: string[];
  metricValues?: Dict<number>;
}

export class Entry<T> extends PropsObject<EntryProps<T>> {
  static givenPortableObject<T>(obj: PortableEntry): Entry<T> {
    return new Entry<T>({
      key: obj.key,
      createdAt: Instant.givenEpochMilliseconds(obj.createdAtMs),
      updatedAt: Instant.givenEpochMilliseconds(obj.updatedAtMs),
      data: obj.data,
      tagKeys: obj.tagKeys,
      metricValues: obj.metricValues,
    });
  }

  readonly key: string;
  tagKeys: string[];
  metricValues: Dict<number>;
  createdAt: Instant;
  updatedAt: Instant;
  data: T;

  constructor(props: EntryProps<T>) {
    super(props);

    this.key = props.key || UniqueId.ofRandom().toUUIDString();
    this.data = props.data;
    this.createdAt = props.createdAt || Instant.ofNow();
    this.updatedAt = props.updatedAt || props.createdAt || Instant.ofNow();
    this.tagKeys = props.tagKeys || [];
    this.metricValues = props.metricValues || {};
  }

  toPortableObject(): PortableEntry {
    return {
      key: this.key,
      tagKeys: this.tagKeys || [],
      metricValues: this.metricValues || {},
      createdAtMs: this.createdAt.toEpochMilliseconds(),
      updatedAtMs: this.updatedAt.toEpochMilliseconds(),
      data: this.data,
    };
  }
}
