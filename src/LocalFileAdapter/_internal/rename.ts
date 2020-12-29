import * as fs from "fs";
import { LocalFile } from "@anderjason/node-filesystem";

export function rename(fromFile: LocalFile, toFile: LocalFile): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.rename(fromFile.toAbsolutePath(), toFile.toAbsolutePath(), (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}
