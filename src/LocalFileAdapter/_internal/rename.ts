import * as fs from "fs";
import { LocalFile } from "@anderjason/node-filesystem";

export async function rename(
  fromFile: LocalFile,
  toFile: LocalFile
): Promise<void> {
  if (fromFile == null) {
    throw new Error("fromFile is required");
  }

  if (toFile == null) {
    throw new Error("toFile is required");
  }

  await toFile.toDirectory().createDirectory();

  return new Promise((resolve, reject) => {
    const fromPath = fromFile.toAbsolutePath();
    const toPath = toFile.toAbsolutePath();

    if (fromPath === toPath) {
      resolve();
      return;
    }

    fs.rename(fromPath, toPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}
