import { Dict, Observable, ObservableDict, ObservableSet } from "@anderjason/observable";
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
export declare class DbRecord<T> extends PropsObject<DbRecordProps<T>> {
    readonly recordKey: string;
    readonly tagKeys: ObservableSet<string>;
    readonly metricValues: ObservableDict<number>;
    readonly createdAt: Observable<Instant>;
    readonly updatedAt: Observable<Instant>;
    readonly recordData: Observable<T>;
    constructor(props: DbRecordProps<T>);
}
