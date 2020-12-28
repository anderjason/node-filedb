import { UnsaltedHash } from "@anderjason/node-crypto";
import { ObservableSet } from "@anderjason/observable";
import { FileDbAdapter } from "../../FileDbAdapters";
import { PropsObject } from "../../PropsObject";
import { PortableTag } from "../Types";

export interface TagProps {
  tagKey: string;
  adapter: FileDbAdapter<PortableTag>;
}

export class Tag extends PropsObject<TagProps> {
  readonly entryKeys = ObservableSet.ofEmpty<string>();

  async load(): Promise<void> {
    const portableTag = await this.props.adapter.toOptionalValueGivenKey(
      this.props.tagKey
    );

    this.entryKeys.sync(portableTag.entryKeys);
  }

  async save(): Promise<void> {
    const hash = UnsaltedHash.givenUnhashedString(this.props.tagKey)
      .toHashedString()
      .slice(0, 24);

    if (this.entryKeys.count > 0) {
      const contents = {
        tagKey: this.props.tagKey,
        entryKeys: this.entryKeys.toArray(),
      };

      await this.props.adapter.writeValue(hash, contents);
    } else {
      await this.props.adapter.deleteKey(hash);
    }
  }
}
