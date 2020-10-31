import { localFileGivenFileDbCollectionKey } from "./localFileGivenFileDbCollectionKey";
import { EncryptedData } from "@anderjason/node-crypto";
import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";

export async function promiseOfUpdatedFileDbCollection(
  directory: LocalDirectory,
  collectionKey: string,
  keys?: Set<string>,
  encryptionKey?: SecretKey
): Promise<void> {
  const collectionFile = localFileGivenFileDbCollectionKey(
    directory,
    collectionKey
  );

  if (keys != null && keys.size > 0) {
    const contents = JSON.stringify({
      collection: collectionKey,
      keys: Array.from(keys),
    });

    let rawFileContents: string;
    if (encryptionKey != null) {
      rawFileContents = EncryptedData.givenDecryptedStringAndKey(
        contents,
        encryptionKey
      ).toEncryptedHexString();
    } else {
      rawFileContents = contents;
    }

    await collectionFile.writeFile(rawFileContents);
  } else {
    await collectionFile.deleteFile();
  }
}
