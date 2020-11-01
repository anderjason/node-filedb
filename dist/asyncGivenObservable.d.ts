import { Observable } from "@anderjason/observable";
export declare function asyncGivenObservable<T>(observable: Observable<T>, filter?: (value: T) => boolean): Promise<T>;
