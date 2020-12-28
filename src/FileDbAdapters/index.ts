import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
import { PortableTag, PortableEntry, PortableMetric } from "../FileDb/Types";
import { LocalFileAdapter } from "../LocalFileAdapter";
import { MemoryAdapter } from "../MemoryAdapter";

export interface FileDbAdapter<T> extends Actor {
  toKeys(): Promise<string[]>;
  toValues(): Promise<T[]>;
  toOptionalValueGivenKey(key: string): Promise<T>;
  writeValue(key: string, value: T): Promise<void>;
  deleteKey(key: string): Promise<void>;
}

interface FileDbAdaptersProps {
  tagsAdapter: FileDbAdapter<PortableTag>;
  entriesAdapter: FileDbAdapter<PortableEntry>;
  metricsAdapter: FileDbAdapter<PortableMetric>;
}

export class FileDbAdapters extends Actor<FileDbAdaptersProps> {
  static ofMemory(): FileDbAdapters {
    return new FileDbAdapters({
      tagsAdapter: new MemoryAdapter(),
      entriesAdapter: new MemoryAdapter(),
      metricsAdapter: new MemoryAdapter(),
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
      tagsAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "tags"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
      entriesAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "data"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
      metricsAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "metrics"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
    });
  }

  onActivate() {
    this.addActor(this.props.tagsAdapter);
    this.addActor(this.props.entriesAdapter);
    this.addActor(this.props.metricsAdapter);
  }
}
