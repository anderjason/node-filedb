import { UnsaltedHash } from "@anderjason/node-crypto";
import { ObservableSet } from "@anderjason/observable";
import { FileDbAdapter, PortableTag } from "../../FileDbAdapters";
import { PropsObject } from "../../PropsObject";

export interface TagProps {
  tagKey: string;
  adapter: FileDbAdapter<PortableTag>;
}

export class Tag extends PropsObject<TagProps> {
  readonly recordKeys = ObservableSet.ofEmpty<string>();

  async load(): Promise<void> {
    const portableTag = await this.props.adapter.toOptionalValueGivenKey(
      this.props.tagKey
    );

    this.recordKeys.sync(portableTag.recordKeys);
  }

  async save(): Promise<void> {
    const hash = UnsaltedHash.givenUnhashedString(this.props.tagKey)
      .toHashedString()
      .slice(0, 24);

    if (this.recordKeys.count > 0) {
      const contents = {
        tagKey: this.props.tagKey,
        recordKeys: this.recordKeys.toArray(),
      };

      await this.props.adapter.writeValue(hash, contents);
    } else {
      await this.props.adapter.deleteKey(hash);
    }
  }
}
