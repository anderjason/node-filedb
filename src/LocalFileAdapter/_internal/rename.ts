import * as fs from "fs";
import { LocalFile } from "@anderjason/node-filesystem";

export function rename(fromFile: LocalFile, toFile: LocalFile): Promise<void> {
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
