import { Dict } from "@anderjason/observable";
import { Instant } from "@anderjason/time";
import { PortableEntry } from "../FileDb/Types";
import { PropsObject } from "../PropsObject";
export interface EntryProps<T> {
    key?: string;
    data?: T;
    createdAt?: Instant;
    updatedAt?: Instant;
    tagKeys?: string[];
    metricValues?: Dict<number>;
}
export declare class Entry<T> extends PropsObject<EntryProps<T>> {
    static givenPortableObject<T>(obj: PortableEntry): Entry<T>;
    readonly key: string;
    tagKeys: string[];
    metricValues: Dict<number>;
    createdAt: Instant;
    updatedAt: Instant;
    data: T;
    constructor(props: EntryProps<T>);
    toPortableObject(): PortableEntry;
}
