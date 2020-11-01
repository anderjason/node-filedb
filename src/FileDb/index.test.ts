import { Test } from "@anderjason/tests";
import { FileDb } from ".";
import { FileDbAdapters } from "../FileDbAdapters";

Test.define("FileDb can be created", () => {
  const fileDb = new FileDb({
    adapters: FileDbAdapters.ofMemory(),
    collectionsGivenData: (data) => new Set(),
    valuesByIndexGivenData: (data) => new Map(),
    label: "test",
  });
  fileDb.activate();

  fileDb.deactivate();
});

Test.define("FileDb can write and read a row", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    collectionsGivenData: (data) => new Set(),
    valuesByIndexGivenData: (data) => new Map(),
    label: "test",
  });
  fileDb.activate();

  const row = await fileDb.toWritePromise({
    message: "hello world",
  });

  Test.assert(row.key != null);
  Test.assert(row.key.length == 36);
  Test.assert(row.createdAt != null);
  Test.assert(row.updatedAt != null);
  Test.assert(row.data.message === "hello world");
  Test.assert(row.collections != null);
  Test.assert(row.valuesByIndex != null);

  const result = await fileDb.toRowGivenKey(row.key);
  Test.assertIsDeepEqual(result, row);

  fileDb.deactivate();
});

Test.define("FileDb can assign rows to collections", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    collectionsGivenData: (data) => {
      const result = new Set<string>();

      result.add("testset1");
      result.add("testset2");

      return result;
    },
    valuesByIndexGivenData: (data) => new Map(),
    label: "test",
  });
  fileDb.activate();

  const row = await fileDb.toWritePromise({
    message: "hello world",
  });

  Test.assert(row.collections.has("testset1"));
  Test.assert(row.collections.has("testset2"));

  fileDb.deactivate();
});

Test.define("FileDb can assign values by index", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    collectionsGivenData: (data) => new Set(),
    valuesByIndexGivenData: (data) => {
      const result = new Map<string, number>();

      result.set("size", 5);
      result.set("views", 23);

      return result;
    },
    label: "test",
  });
  fileDb.activate();

  const row = await fileDb.toWritePromise({
    message: "hello world",
  });

  Test.assert(row.valuesByIndex.get("size") === 5);
  Test.assert(row.valuesByIndex.get("views") === 23);

  fileDb.deactivate();
});
