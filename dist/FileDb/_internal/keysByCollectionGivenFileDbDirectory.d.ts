import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";
export declare function keysByCollectionGivenFileDbDirectory(directory: LocalDirectory, encryptionKey?: SecretKey): Promise<Map<string, Set<string>>>;
