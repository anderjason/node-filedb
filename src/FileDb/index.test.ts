import { Dict } from "@anderjason/observable";
import { Test } from "@anderjason/tests";
import { FileDb } from ".";
import { FileDbAdapters } from "../FileDbAdapters";

Test.define("FileDb can be created", () => {
  const fileDb = new FileDb({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => new Set(),
    metricsGivenEntryData: (data) => ({}),
  });
  fileDb.activate();

  fileDb.deactivate();
});

Test.define("FileDb can write and read a row", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => new Set(),
    metricsGivenEntryData: (data) => ({}),
  });
  fileDb.activate();

  const entry = await fileDb.writeEntry({
    message: "hello world",
  });

  Test.assert(entry.entryKey != null);
  Test.assert(entry.entryKey.length == 36);
  Test.assert(entry.createdAt != null);
  Test.assert(entry.updatedAt != null);
  Test.assert(entry.data.value.message === "hello world");

  const result = await fileDb.toEntryGivenKey(entry.entryKey);
  Test.assertIsDeepEqual(result, entry);

  fileDb.deactivate();
});

Test.define("FileDb can assign rows to collections", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => {
      const result = new Set<string>();

      result.add("testset1");
      result.add("testset2");

      return result;
    },
    metricsGivenEntryData: (data) => ({}),
  });
  fileDb.activate();

  const entry = await fileDb.writeEntry({
    message: "hello world",
  });

  Test.assert(entry.tagKeys.hasValue("testset1"));
  Test.assert(entry.tagKeys.hasValue("testset2"));

  fileDb.deactivate();
});

Test.define("FileDb can assign values by index", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => new Set(),
    metricsGivenEntryData: (data) => {
      const result: Dict<number> = {};

      result.size = 5;
      result.views = 23;

      return result;
    },
  });
  fileDb.activate();

  const row = await fileDb.writeEntry({
    message: "hello world",
  });

  Test.assert(row.metricValues.toOptionalValueGivenKey("size") === 5);
  Test.assert(row.metricValues.toOptionalValueGivenKey("views") === 23);

  fileDb.deactivate();
});
