import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableTag } from "../FileDb/Types";

export interface TagProps {
  tagKey: string;
  adapter: FileDbAdapter<PortableTag>;
}

export class Tag extends PropsObject<TagProps> {
  readonly tagPrefix: string;
  readonly key: string;
  entryKeys = new Set<string>();

  constructor(props: TagProps) {
    super(props);

    if (props.tagKey == null) {
      throw new Error("tagKey is required");
    }

    if (props.adapter == null) {
      throw new Error("adapter is required");
    }

    this.key = props.tagKey;
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

    this.entryKeys = new Set(portableTag.entryKeys);
  }

  async save(): Promise<void> {
    if (this.entryKeys.size > 0) {
      await this.props.adapter.writeValue(
        this.props.tagKey,
        this.toPortableObject()
      );
    } else {
      await this.props.adapter.deleteKey(this.props.tagKey);
    }
  }

  toPortableObject(): PortableTag {
    return {
      key: this.key,
      entryKeys: Array.from(this.entryKeys || new Set()),
    };
  }
}
