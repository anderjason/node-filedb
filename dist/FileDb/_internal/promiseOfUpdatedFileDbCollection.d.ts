import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";
export declare function promiseOfUpdatedFileDbCollection(directory: LocalDirectory, collectionKey: string, keys?: Set<string>, encryptionKey?: SecretKey): Promise<void>;
