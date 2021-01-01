import { ObservableSet } from "@anderjason/observable";
import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableTag } from "../FileDb/Types";

export interface TagProps {
  tagKey: string;
  adapter: FileDbAdapter<PortableTag>;
}

export class Tag extends PropsObject<TagProps> {
  readonly tagPrefix: string;
  readonly tagKey: string;
  readonly entryKeys = ObservableSet.ofEmpty<string>();

  constructor(props: TagProps) {
    super(props);

    if (props.tagKey == null) {
      throw new Error("tagKey is required");
    }

    if (props.adapter == null) {
      throw new Error("adapter is required");
    }

    this.tagKey = props.tagKey;
    this.tagPrefix = props.tagKey.split(":")[0];
  }

  async load(): Promise<void> {
    const portableTag = await this.props.adapter.toOptionalValueGivenKey(
      this.props.tagKey
    );

    if (portableTag == null) {
      throw new Error(
        `Tags adapter returned null for tagKey '${this.props.tagKey}'`
      );
    }

    this.entryKeys.sync(portableTag.entryKeys);
  }

  async save(): Promise<void> {
    if (this.entryKeys.count > 0) {
      const contents = {
        tagKey: this.props.tagKey,
        entryKeys: this.entryKeys.toArray(),
      };

      await this.props.adapter.writeValue(this.props.tagKey, contents);
    } else {
      await this.props.adapter.deleteKey(this.props.tagKey);
    }
  }

  toObject(): any {
    return {
      tagKey: this.tagKey,
      entryKeys: this.entryKeys.toArray(),
    };
  }
}
