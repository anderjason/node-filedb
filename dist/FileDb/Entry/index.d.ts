import { Dict, Observable, ObservableDict, ObservableSet } from "@anderjason/observable";
import { Instant } from "@anderjason/time";
import { PropsObject } from "../../PropsObject";
export interface EntryProps<T> {
    entryKey?: string;
    data?: T;
    createdAt?: Instant;
    updatedAt?: Instant;
    tagKeys?: Set<string>;
    metricValues?: Dict<number>;
}
export declare class Entry<T> extends PropsObject<EntryProps<T>> {
    readonly entryKey: string;
    readonly tagKeys: ObservableSet<string>;
    readonly metricValues: ObservableDict<number>;
    readonly createdAt: Observable<Instant>;
    readonly updatedAt: Observable<Instant>;
    readonly data: Observable<T>;
    constructor(props: EntryProps<T>);
}
