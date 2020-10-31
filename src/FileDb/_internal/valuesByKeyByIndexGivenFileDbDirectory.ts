import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";
import { PromiseUtil } from "@anderjason/util";
import { SerializableFileDbIndex } from "..";
import { EncryptedData } from "@anderjason/node-crypto";

export async function valuesByKeyByIndexGivenFileDbDirectory(
  directory: LocalDirectory,
  encryptionKey?: SecretKey
): Promise<Map<string, Map<string, number>>> {
  const result = new Map<string, Map<string, number>>();

  const indexesDirectory = LocalDirectory.givenRelativePath(
    directory,
    "indexes"
  );

  await indexesDirectory.createDirectory();
  const indexFiles = await indexesDirectory.toDescendantFiles();

  await PromiseUtil.asyncSequenceGivenArrayAndCallback(
    indexFiles,
    async (indexFile) => {
      if (indexFile.toExtension() !== ".json") {
        return;
      }

      const rawFileContents = await indexFile.toContentString();

      let contents: SerializableFileDbIndex;

      if (encryptionKey != null) {
        contents = JSON.parse(
          EncryptedData.givenEncryptedHexString(
            rawFileContents
          ).toDecryptedString(encryptionKey)
        );
      } else {
        contents = JSON.parse(rawFileContents);
      }

      const valuesByKey = new Map<string, number>(
        Object.entries(contents.valuesByKey)
      );

      result.set(contents.index, valuesByKey);
    }
  );

  return result;
}
