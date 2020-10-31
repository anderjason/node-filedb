import { LocalDirectory } from "@anderjason/node-filesystem";
import { SecretKey } from "@anderjason/node-crypto";
import { PromiseUtil } from "@anderjason/util";
import { EncryptedData } from "@anderjason/node-crypto";
import { SerializableFileDbCollection } from "..";

export async function keysByCollectionGivenFileDbDirectory(
  directory: LocalDirectory,
  encryptionKey?: SecretKey
): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>();

  const collectionsDirectory = LocalDirectory.givenRelativePath(
    directory,
    "collections"
  );

  await collectionsDirectory.createDirectory();
  const collectionFiles = await collectionsDirectory.toDescendantFiles();

  await PromiseUtil.asyncSequenceGivenArrayAndCallback(
    collectionFiles,
    async (collectionFile) => {
      if (collectionFile.toExtension() !== ".json") {
        return;
      }

      const rawFileContents = await collectionFile.toContentString();
      let contents: SerializableFileDbCollection;

      if (encryptionKey != null) {
        contents = JSON.parse(
          EncryptedData.givenEncryptedHexString(
            rawFileContents
          ).toDecryptedString(encryptionKey)
        );
      } else {
        contents = JSON.parse(rawFileContents);
      }

      const keys = new Set<string>(contents.keys);

      result.set(contents.collection, keys);
    }
  );

  return result;
}
