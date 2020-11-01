import { UnsaltedHash } from "@anderjason/node-crypto";
import { LocalDirectory, LocalFile } from "@anderjason/node-filesystem";
import { PromiseUtil } from "@anderjason/util";
import { Actor } from "skytree";
import { FileDbAdapter } from "../FileDbAdapters";

export interface LocalFileAdapterProps<T> {
  directory: LocalDirectory;
  valueGivenBuffer: (buffer: Buffer) => T;
  bufferGivenValue: (value: T) => Buffer;
}

export class LocalFileAdapter<T>
  extends Actor<LocalFileAdapterProps<T>>
  implements FileDbAdapter<T> {
  async toKeys(): Promise<string[]> {
    await this.props.directory.createDirectory();

    const files = await this.props.directory.toDescendantFiles();

    const result = files
      .filter((file) => file.hasExtension([".json"]))
      .map((file) => file.toFilenameWithoutExtension());

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
        const buffer = await file.toContentBuffer();
        return this.props.valueGivenBuffer(buffer);
      }
    );

    return result;
  }

  async toOptionalValue(key: string): Promise<T> {
    const file = this.fileGivenKey(key);
    const isAccessible = await file.isAccessible();
    if (!isAccessible) {
      return undefined;
    }

    const buffer = await file.toContentBuffer();
    return this.props.valueGivenBuffer(buffer);
  }

  async setValue(key: string, value: T): Promise<void> {
    const file = this.fileGivenKey(key);
    await file.toDirectory().createDirectory();

    const buffer = this.props.bufferGivenValue(value);
    await file.writeFile(buffer);
  }

  async deleteKey(key: string): Promise<void> {
    const file = this.fileGivenKey(key);
    const isAccessible = await file.isAccessible();
    if (!isAccessible) {
      return undefined;
    }

    await file.deleteFile();
  }

  private fileGivenKey(key: string): LocalFile {
    const hash = UnsaltedHash.givenUnhashedString(key)
      .toHashedString()
      .slice(0, 24);

    return LocalFile.givenRelativePath(
      this.props.directory,
      hash.slice(0, 3),
      `${hash}.json`
    );
  }
}
