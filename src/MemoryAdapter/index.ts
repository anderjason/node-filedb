import { Actor } from "skytree";
import { PortableKeyObject } from "../FileDb/Types";
import { FileDbAdapter } from "../FileDbAdapters";

export class MemoryAdapter<T extends PortableKeyObject>
  extends Actor<void>
  implements FileDbAdapter<T> {
  private _data = new Map<string, T>();

  async toKeys(): Promise<string[]> {
    if (this.isActive.value == false) {
      return undefined;
    }

    return Array.from(this._data.keys());
  }

  async toValues(): Promise<T[]> {
    if (this.isActive.value == false) {
      return undefined;
    }

    return Array.from(this._data.values());
  }

  async toOptionalValueGivenKey(key: string): Promise<T> {
    if (this.isActive.value == false) {
      return undefined;
    }

    return this._data.get(key);
  }

  async writeValue(key: string, value: T): Promise<void> {
    if (this.isActive.value == false) {
      return;
    }

    this._data.set(key, value);
  }

  async deleteKey(key: string): Promise<void> {
    if (this.isActive.value == false) {
      return;
    }

    this._data.delete(key);
  }

  async rebuild(): Promise<void> {
    return;
  }
}
