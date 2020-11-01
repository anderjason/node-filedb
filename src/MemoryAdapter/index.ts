import { Actor } from "skytree";
import { FileDbAdapter } from "../FileDb/FileDbAdapter";

export class MemoryAdapter<T> extends Actor<void> implements FileDbAdapter<T> {
  private _data = new Map<string, T>();

  async toKeys(): Promise<string[]> {
    if (this.isActive.value == false) {
      throw new Error("MemoryAdapter is not active");
    }

    return Array.from(this._data.keys());
  }

  async toValues(): Promise<T[]> {
    if (this.isActive.value == false) {
      throw new Error("MemoryAdapter is not active");
    }

    return Array.from(this._data.values());
  }

  async toOptionalValue(key: string): Promise<T> {
    if (this.isActive.value == false) {
      throw new Error("MemoryAdapter is not active");
    }

    return this._data.get(key);
  }

  async setValue(key: string, value: T): Promise<void> {
    if (this.isActive.value == false) {
      throw new Error("MemoryAdapter is not active");
    }

    this._data.set(key, value);
  }

  async deleteKey(key: string): Promise<void> {
    if (this.isActive.value == false) {
      throw new Error("MemoryAdapter is not active");
    }

    this._data.delete(key);
  }
}
