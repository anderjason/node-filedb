import { LocalDirectory, LocalFile } from "@anderjason/node-filesystem";
import { PromiseUtil } from "@anderjason/util";
import { Actor } from "skytree";
import { FileDbAdapter, PortableValueResult } from "../FileDbAdapters";

export interface LocalFileAdapterProps<T> {
  directory: LocalDirectory;
  valueGivenBuffer: (buffer: Buffer) => PortableValueResult<T>;
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
    const file = this.fileGivenKey(key);
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
    return LocalFile.givenRelativePath(
      this.props.directory,
      key.slice(0, 3),
      `${key}.json`
    );
  }
}
