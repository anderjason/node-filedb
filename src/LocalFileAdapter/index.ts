import { UnsaltedHash } from "@anderjason/node-crypto";
import { LocalDirectory, LocalFile } from "@anderjason/node-filesystem";
import {
  Observable,
  ObservableSet,
  ReadOnlyObservable,
} from "@anderjason/observable";
import { Debounce, Duration } from "@anderjason/time";
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
  private _keys = ObservableSet.ofEmpty<string>();
  private _isReady = Observable.givenValue<boolean>(
    false,
    Observable.isStrictEqual
  );
  readonly isReady = ReadOnlyObservable.givenObservable(this._isReady);

  private writeKeyCacheLater = new Debounce({
    fn: async () => {
      const keyCacheContents = JSON.stringify(this._keys.toArray());
      await this.keyCacheFile.writeFile(keyCacheContents);
    },
    duration: Duration.givenSeconds(0.5),
  });

  onActivate() {
    this.load();

    this._keys.didChange.subscribe(async (keys) => {
      if (this._isReady.value == false) {
        return;
      }

      this.writeKeyCacheLater.invoke();
    });
  }

  async toKeys(): Promise<string[]> {
    if (this.isReady.value == true) {
      return this._keys.toArray();
    }

    await this._isReady.toPromise((v) => v == true);

    return this._keys.toArray();
  }

  private get keyCacheFile(): LocalFile {
    return LocalFile.givenRelativePath(this.props.directory, "keys.cache");
  }

  private async load(): Promise<void> {
    await this.props.directory.createDirectory();

    let keys: string[];

    let keyCacheFileExists = await this.keyCacheFile.isAccessible();
    if (keyCacheFileExists) {
      try {
        const contents = await this.keyCacheFile.toContentString();
        keys = JSON.parse(contents);
      } catch (err) {
        console.warn(err);
        await this.keyCacheFile.deleteFile();
        keyCacheFileExists = false;
      }
    }

    if (keys == null) {
      const files = await this.getDataFiles();

      keys = await PromiseUtil.asyncValuesGivenArrayAndConverter(
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
    }

    this._keys.sync(keys);

    if (keyCacheFileExists == false) {
      this.writeKeyCacheLater.invoke();
    }

    this._isReady.setValue(true);
  }

  async toValues(): Promise<T[]> {
    await this.props.directory.createDirectory();

    const files = await this.getDataFiles();

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

    this._keys.addValue(key);
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

    await this._keys.removeValue(key);
  }

  private async getDataFiles(): Promise<LocalFile[]> {
    let files = await this.props.directory.toDescendantFiles();

    files = files.filter((file) => {
      return file.hasExtension([".json"]);
    });

    return files;
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
