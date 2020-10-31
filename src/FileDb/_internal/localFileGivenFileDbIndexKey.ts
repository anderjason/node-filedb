import { LocalFile } from "@anderjason/node-filesystem";
import { UnsaltedHash } from "@anderjason/node-crypto";
import { LocalDirectory } from "@anderjason/node-filesystem";

export function localFileGivenFileDbIndexKey(
  directory: LocalDirectory,
  key: string
): LocalFile {
  const hash = UnsaltedHash.givenUnhashedString(key)
    .toHashedString()
    .slice(0, 24);

  return LocalFile.givenRelativePath(
    directory,
    "indexes",
    hash.slice(0, 3),
    `${hash}.json`
  );
}
