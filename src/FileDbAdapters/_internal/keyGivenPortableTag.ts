import { PortableTag } from "../../FileDb/Types";

export function keyGivenPortableTag(portableTag: PortableTag): string {
  return portableTag.tagKey;
}
