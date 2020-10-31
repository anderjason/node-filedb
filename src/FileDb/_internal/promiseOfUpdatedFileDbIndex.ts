import { localFileGivenFileDbIndexKey } from "./localFileGivenFileDbIndexKey";
import { EncryptedData } from "@anderjason/node-crypto";
import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";

export async function promiseOfUpdatedFileDbIndex(
  directory: LocalDirectory,
  indexKey: string,
  valuesByKey?: Map<string, number>,
  encryptionKey?: SecretKey
): Promise<void> {
  const indexFile = localFileGivenFileDbIndexKey(directory, indexKey);

  if (valuesByKey != null && valuesByKey.size > 0) {
    const obj: any = {};
    for (let [key, value] of valuesByKey) {
      obj[key] = value;
    }

    const contents = JSON.stringify({
      index: indexKey,
      valuesByKey: obj,
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

    await indexFile.writeFile(rawFileContents);
  } else {
    await indexFile.deleteFile();
  }
}
