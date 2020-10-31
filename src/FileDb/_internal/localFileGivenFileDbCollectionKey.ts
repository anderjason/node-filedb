import { LocalDirectory } from "@anderjason/node-filesystem";
import { UnsaltedHash } from "@anderjason/node-crypto";
import { LocalFile } from "@anderjason/node-filesystem";

export function localFileGivenFileDbCollectionKey(
  directory: LocalDirectory,
  collectionKey: string
): LocalFile {
  const hash = UnsaltedHash.givenUnhashedString(collectionKey)
    .toHashedString()
    .slice(0, 24);

  return LocalFile.givenRelativePath(
    directory,
    "collections",
    hash.slice(0, 3),
    `${hash}.json`
  );
}
