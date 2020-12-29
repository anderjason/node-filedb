import { PortableEntry } from "../../FileDb/Types";

export function keyGivenPortableEntry(portableEntry: PortableEntry): string {
  return portableEntry.entryKey;
}
