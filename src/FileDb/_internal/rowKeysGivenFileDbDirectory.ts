import { LocalDirectory } from "@anderjason/node-filesystem";

export async function rowKeysGivenFileDbDirectory(
  directory: LocalDirectory
): Promise<string[]> {
  const isAccessible = await directory.isAccessible();
  if (!isAccessible) {
    return [];
  }

  const dataDirectory = LocalDirectory.givenRelativePath(directory, "data");

  await dataDirectory.createDirectory();

  const files = await dataDirectory.toDescendantFiles();

  const result = files
    .filter((file) => file.toExtension() === ".json")
    .map((file) => file.toFilenameWithoutExtension());

  return result;
}
