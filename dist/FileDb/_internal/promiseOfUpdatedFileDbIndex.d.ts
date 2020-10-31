import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";
export declare function promiseOfUpdatedFileDbIndex(directory: LocalDirectory, indexKey: string, valuesByKey?: Map<string, number>, encryptionKey?: SecretKey): Promise<void>;
