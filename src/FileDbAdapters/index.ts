import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
import { PortableTag, PortableEntry, PortableMetric } from "../FileDb/Types";
import { LocalFileAdapter } from "../LocalFileAdapter";
import { MemoryAdapter } from "../MemoryAdapter";
import { bufferGivenPortableEntry } from "./_internal/bufferGivenPortableEntry";
import { bufferGivenPortableMetric } from "./_internal/bufferGivenPortableMetric";
import { bufferGivenPortableTag } from "./_internal/bufferGivenPortableTag";
import { keyGivenPortableEntry } from "./_internal/keyGivenPortableEntry";
import { keyGivenPortableMetric } from "./_internal/keyGivenPortableMetric";
import { keyGivenPortableTag } from "./_internal/keyGivenPortableTag";
import { portableEntryResultGivenBuffer } from "./_internal/portableEntryResultGivenBuffer";
import { portableMetricResultGivenBuffer } from "./_internal/portableMetricResultGivenBuffer";
import { portableTagResultGivenBuffer } from "./_internal/portableTagResultGivenBuffer";

export interface PortableValueResult<T> {
  value: T;
  shouldRewriteStorage: boolean;
}

export interface FileDbAdapter<T> extends Actor {
  toKeys(): Promise<string[]>;
  toValues(): Promise<T[]>;
  toOptionalValueGivenKey(key: string): Promise<T>;
  writeValue(key: string, value: T): Promise<void>;
  deleteKey(key: string): Promise<void>;
  rebuild(): Promise<void>;
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
    return new FileDbAdapters({
      tagsAdapter: new LocalFileAdapter<PortableTag>({
        directory: LocalDirectory.givenRelativePath(directory, "tags"),
        keyGivenValue: keyGivenPortableTag,
        bufferGivenValue: bufferGivenPortableTag,
        valueGivenBuffer: portableTagResultGivenBuffer,
      }),
      entriesAdapter: new LocalFileAdapter<PortableEntry>({
        directory: LocalDirectory.givenRelativePath(directory, "entries"),
        keyGivenValue: keyGivenPortableEntry,
        bufferGivenValue: bufferGivenPortableEntry,
        valueGivenBuffer: portableEntryResultGivenBuffer,
      }),
      metricsAdapter: new LocalFileAdapter<PortableMetric>({
        directory: LocalDirectory.givenRelativePath(directory, "metrics"),
        keyGivenValue: keyGivenPortableMetric,
        bufferGivenValue: bufferGivenPortableMetric,
        valueGivenBuffer: portableMetricResultGivenBuffer,
      }),
    });
  }

  onActivate() {
    this.addActor(this.props.tagsAdapter);
    this.addActor(this.props.entriesAdapter);
    this.addActor(this.props.metricsAdapter);
  }
}
