import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
import {
  PortableTag,
  PortableEntry,
  PortableMetric,
  PortableKeyObject,
} from "../FileDb/Types";
import { LocalFileAdapter } from "../LocalFileAdapter";
import { MemoryAdapter } from "../MemoryAdapter";
import { bufferGivenPortableEntry } from "./_internal/bufferGivenPortableEntry";
import { bufferGivenPortableMetric } from "./_internal/bufferGivenPortableMetric";
import { bufferGivenPortableTag } from "./_internal/bufferGivenPortableTag";
import { portableEntryResultGivenBuffer } from "./_internal/portableEntryResultGivenBuffer";
import { portableMetricResultGivenBuffer } from "./_internal/portableMetricResultGivenBuffer";
import { portableTagResultGivenBuffer } from "./_internal/portableTagResultGivenBuffer";

export interface PortableValueResult<T> {
  value: T;
  shouldRewriteStorage: boolean;
}

export interface FileDbAdapter<T extends PortableKeyObject> extends Actor {
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
  readonly tagsAdapter: FileDbAdapter<PortableTag>;
  readonly entriesAdapter: FileDbAdapter<PortableEntry>;
  readonly metricsAdapter: FileDbAdapter<PortableMetric>;

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
        bufferGivenValue: bufferGivenPortableTag,
        valueGivenBuffer: portableTagResultGivenBuffer,
      }),
      entriesAdapter: new LocalFileAdapter<PortableEntry>({
        directory: LocalDirectory.givenRelativePath(directory, "entries"),
        bufferGivenValue: bufferGivenPortableEntry,
        valueGivenBuffer: portableEntryResultGivenBuffer,
      }),
      metricsAdapter: new LocalFileAdapter<PortableMetric>({
        directory: LocalDirectory.givenRelativePath(directory, "metrics"),
        bufferGivenValue: bufferGivenPortableMetric,
        valueGivenBuffer: portableMetricResultGivenBuffer,
      }),
    });
  }

  constructor(props: FileDbAdaptersProps) {
    super(props);

    this.tagsAdapter = props.tagsAdapter;
    this.metricsAdapter = props.metricsAdapter;
    this.entriesAdapter = props.entriesAdapter;
  }

  onActivate() {
    this.addActor(this.tagsAdapter);
    this.addActor(this.entriesAdapter);
    this.addActor(this.metricsAdapter);
  }
}
