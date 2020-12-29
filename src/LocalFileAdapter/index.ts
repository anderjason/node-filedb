import { UnsaltedHash } from "@anderjason/node-crypto";
import { LocalDirectory, LocalFile } from "@anderjason/node-filesystem";
import { PromiseUtil } from "@anderjason/util";
import { Actor } from "skytree";
import { FileDbAdapter, PortableValueResult } from "../FileDbAdapters";
import { rename } from "./_internal/rename";

export interface LocalFileAdapterProps<T> {
  directory: LocalDirectory;
  valueGivenBuffer: (buffer: Buffer) => PortableValueResult<T>;
  keyGivenValue: (value: T) => string;
  bufferGivenValue: (value: T) => Buffer;
}

export class LocalFileAdapter<T>
  extends Actor<LocalFileAdapterProps<T>>
  implements FileDbAdapter<T> {
  async toKeys(): Promise<string[]> {
    await this.props.directory.createDirectory();

    let files = await this.props.directory.toDescendantFiles();
    files = files.filter((file) => {
      return file.hasExtension([".json"]);
    });

    const result: string[] = await PromiseUtil.asyncValuesGivenArrayAndConverter(
      files,
      async (file) => {
        let buffer = await file.toContentBuffer();
        const portableValueResult = this.props.valueGivenBuffer(buffer);

        if (portableValueResult.shouldRewriteStorage == true) {
          buffer = this.props.bufferGivenValue(portableValueResult.value);
          await file.writeFile(buffer);
        }

        return this.props.keyGivenValue(portableValueResult.value);
      }
    );

    return result;
  }

  async toValues(): Promise<T[]> {
    await this.props.directory.createDirectory();

    let files = await this.props.directory.toDescendantFiles();
    files = files.filter((file) => {
      return file.hasExtension([".json"]);
    });

    const result = await PromiseUtil.asyncValuesGivenArrayAndConverter(
      files,
      async (file) => {
        let buffer = await file.toContentBuffer();
        const portableValueResult = this.props.valueGivenBuffer(buffer);

        if (portableValueResult.shouldRewriteStorage == true) {
          buffer = this.props.bufferGivenValue(portableValueResult.value);
          await file.writeFile(buffer);
        }

        return portableValueResult.value;
      }
    );

    return result;
  }

  async toOptionalValueGivenKey(key: string): Promise<T> {
    if (key == null) {
      throw new Error("Key is required");
    }

    const file = await this.fileGivenKey(key);
    const isAccessible = await file.isAccessible();
    if (!isAccessible) {
      return undefined;
    }

    let buffer = await file.toContentBuffer();
    const portableValueResult = this.props.valueGivenBuffer(buffer);

    if (portableValueResult.shouldRewriteStorage == true) {
      buffer = this.props.bufferGivenValue(portableValueResult.value);
      await file.writeFile(buffer);
    }

    return portableValueResult.value;
  }

  async writeValue(key: string, value: T): Promise<void> {
    if (key == null) {
      throw new Error("Key is required");
    }

    const file = await this.fileGivenKey(key);
    await file.toDirectory().createDirectory();

    const buffer = this.props.bufferGivenValue(value);
    await file.writeFile(buffer);
  }

  async deleteKey(key: string): Promise<void> {
    if (key == null) {
      throw new Error("Key is required");
    }

    const file = await this.fileGivenKey(key);
    const isAccessible = await file.isAccessible();
    if (!isAccessible) {
      return undefined;
    }

    await file.deleteFile();
  }

  private oldFileGivenKey(key: string): LocalFile {
    if (key == null) {
      throw new Error("Key is required");
    }

    return LocalFile.givenRelativePath(
      this.props.directory,
      key.slice(0, 3),
      `${key}.json`
    );
  }

  private oldFile2GivenKey(key: string): LocalFile {
    const hash = UnsaltedHash.givenUnhashedString(key)
      .toHashedString()
      .slice(0, 24);

    return LocalFile.givenRelativePath(
      this.props.directory,
      hash.slice(0, 3),
      `${hash}.json`
    );
  }

  private newFileGivenKey(key: string): LocalFile {
    if (key == null) {
      throw new Error("Key is required");
    }

    const hash = UnsaltedHash.givenUnhashedString(key)
      .toHashedString()
      .slice(0, 16);

    return LocalFile.givenRelativePath(
      this.props.directory,
      hash.slice(0, 1),
      hash.slice(1, 2),
      hash.slice(2, 3),
      `${hash}.json`
    );
  }

  private async fileGivenKey(key: string): Promise<LocalFile> {
    if (key == null) {
      throw new Error("Key is required");
    }

    const newFile = this.newFileGivenKey(key);

    const oldFile = this.oldFileGivenKey(key);
    const oldFileExists = await oldFile.isAccessible();
    if (oldFileExists == true) {
      console.log(
        `Renaming ${oldFile.toAbsolutePath()} to ${newFile.toAbsolutePath()}...`
      );
      await newFile.toDirectory().createDirectory();
      await rename(oldFile, newFile);
    } else {
      const oldFile2 = this.oldFile2GivenKey(key);
      const oldFile2Exists = await oldFile2.isAccessible();
      if (oldFile2Exists == true) {
        console.log(
          `Renaming ${oldFile2.toAbsolutePath()} to ${newFile.toAbsolutePath()}...`
        );
        await newFile.toDirectory().createDirectory();
        await rename(oldFile2, newFile);
      }
    }

    return newFile;
  }
}
