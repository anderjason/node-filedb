import { LocalFile } from "@anderjason/node-filesystem";
import { LocalDirectory } from "@anderjason/node-filesystem";

export function localFileGivenFileDbKey(
  directory: LocalDirectory,
  key: string
): LocalFile {
  return LocalFile.givenRelativePath(
    directory,
    "data",
    key.slice(0, 3),
    `${key}.json`
  );
}
