import { Dict } from "@anderjason/observable";
import { Test } from "@anderjason/tests";
import { FileDb } from ".";
import { FileDbAdapters } from "../FileDbAdapters";

Test.define("FileDb can be created", () => {
  const fileDb = new FileDb({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => [],
    metricsGivenEntryData: (data) => ({}),
  });
  fileDb.activate();

  fileDb.deactivate();
});

Test.define("FileDb can write and read a row", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => [],
    metricsGivenEntryData: (data) => ({}),
  });
  fileDb.activate();

  const entry = await fileDb.writeEntry({
    message: "hello world",
  });

  Test.assert(entry.key != null);
  Test.assert(entry.key.length == 36);
  Test.assert(entry.createdAt != null);
  Test.assert(entry.updatedAt != null);
  Test.assert(entry.data.message === "hello world");

  const result = await fileDb.toEntryGivenKey(entry.key);
  Test.assertIsDeepEqual(result, entry);

  fileDb.deactivate();
});

Test.define("FileDb can assign rows to collections", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => {
      return ["testset1", "testset2"];
    },
    metricsGivenEntryData: (data) => ({}),
  });
  fileDb.activate();

  const entry = await fileDb.writeEntry({
    message: "hello world",
  });

  Test.assert(entry.tagKeys.includes("testset1"));
  Test.assert(entry.tagKeys.includes("testset2"));

  fileDb.deactivate();
});

Test.define("FileDb can assign values by index", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenEntryData: (data) => [],
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

  Test.assert(row.metricValues.size === 5);
  Test.assert(row.metricValues.views === 23);

  fileDb.deactivate();
});
