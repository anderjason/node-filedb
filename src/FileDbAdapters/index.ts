import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
import { LocalFileAdapter } from "../LocalFileAdapter";
import { MemoryAdapter } from "../MemoryAdapter";

export interface FileDbAdapter<T> extends Actor {
  toKeys(): Promise<string[]>;
  toValues(): Promise<T[]>;
  toOptionalValue(key: string): Promise<T>;
  setValue(key: string, value: T): Promise<void>;
  deleteKey(key: string): Promise<void>;
}

export interface PortableCollection {
  collection: string;
  keys: string[];
}

export interface PortableIndex {
  index: string;
  valuesByKey: {
    [key: string]: number;
  };
}

export interface PortableRow {
  key: string;
  createdAtMs: number;
  updatedAtMs: number;
  data: any;

  collections?: string[];
  valuesByIndex?: {
    [index: string]: number;
  };
}

interface FileDbAdaptersProps {
  collectionsAdapter: FileDbAdapter<PortableCollection>;
  dataAdapter: FileDbAdapter<PortableRow>;
  indexesAdapter: FileDbAdapter<PortableIndex>;
}

export class FileDbAdapters extends Actor<FileDbAdaptersProps> {
  static ofMemory(): FileDbAdapters {
    return new FileDbAdapters({
      collectionsAdapter: new MemoryAdapter(),
      dataAdapter: new MemoryAdapter(),
      indexesAdapter: new MemoryAdapter(),
    });
  }

  static givenDirectory(directory: LocalDirectory): FileDbAdapters {
    const valueGivenBuffer = (buffer: Buffer): any => {
      return JSON.parse(buffer.toString());
    };

    const bufferGivenValue = (value: any): Buffer => {
      return Buffer.from(JSON.stringify(value));
    };

    return new FileDbAdapters({
      collectionsAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "collections"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
      dataAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "data"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
      indexesAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "indexes"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
    });
  }

  onActivate() {
    this.addActor(this.props.collectionsAdapter);
    this.addActor(this.props.dataAdapter);
    this.addActor(this.props.indexesAdapter);
  }
}
