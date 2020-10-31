import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";
export declare function valuesByKeyByIndexGivenFileDbDirectory(directory: LocalDirectory, encryptionKey?: SecretKey): Promise<Map<string, Map<string, number>>>;
