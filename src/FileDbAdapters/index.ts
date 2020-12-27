import { LocalDirectory } from "@anderjason/node-filesystem";
import { Actor } from "skytree";
import { LocalFileAdapter } from "../LocalFileAdapter";
import { MemoryAdapter } from "../MemoryAdapter";

export type MetricValue = number;

export interface FileDbAdapter<T> extends Actor {
  toKeys(): Promise<string[]>;
  toValues(): Promise<T[]>;
  toOptionalValueGivenKey(key: string): Promise<T>;
  writeValue(key: string, value: T): Promise<void>;
  deleteKey(key: string): Promise<void>;
}

export interface PortableTag {
  tagKey: string;
  recordKeys: string[];
}

export interface PortableRecordMetricValues {
  [recordKey: string]: MetricValue;
}

export interface PortableMetric {
  metricKey: string;
  recordMetricValues: PortableRecordMetricValues;
}

export interface PortableRecord {
  recordKey: string;
  createdAtMs: number;
  updatedAtMs: number;
  data: any;

  tagKeys?: string[];
  metricValues?: {
    [metricKey: string]: number;
  };
}

interface FileDbAdaptersProps {
  tagsAdapter: FileDbAdapter<PortableTag>;
  recordsAdapter: FileDbAdapter<PortableRecord>;
  metricsAdapter: FileDbAdapter<PortableMetric>;
}

export class FileDbAdapters extends Actor<FileDbAdaptersProps> {
  static ofMemory(): FileDbAdapters {
    return new FileDbAdapters({
      tagsAdapter: new MemoryAdapter(),
      recordsAdapter: new MemoryAdapter(),
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
        directory: LocalDirectory.givenRelativePath(directory, "collections"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
      recordsAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "data"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
      metricsAdapter: new LocalFileAdapter({
        directory: LocalDirectory.givenRelativePath(directory, "indexes"),
        bufferGivenValue,
        valueGivenBuffer,
      }),
    });
  }

  onActivate() {
    this.addActor(this.props.tagsAdapter);
    this.addActor(this.props.recordsAdapter);
    this.addActor(this.props.metricsAdapter);
  }
}
