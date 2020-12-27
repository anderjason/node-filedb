import { Dict } from "@anderjason/observable";
import { Test } from "@anderjason/tests";
import { FileDb } from ".";
import { FileDbAdapters } from "../FileDbAdapters";

Test.define("FileDb can be created", () => {
  const fileDb = new FileDb({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenRecordData: (data) => new Set(),
    metricsGivenRecordData: (data) => ({}),
  });
  fileDb.activate();

  fileDb.deactivate();
});

Test.define("FileDb can write and read a row", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenRecordData: (data) => new Set(),
    metricsGivenRecordData: (data) => ({}),
  });
  fileDb.activate();

  const row = await fileDb.writeRecord({
    message: "hello world",
  });

  Test.assert(row.recordKey != null);
  Test.assert(row.recordKey.length == 36);
  Test.assert(row.createdAt != null);
  Test.assert(row.updatedAt != null);
  Test.assert(row.recordData.value.message === "hello world");

  const result = await fileDb.toRecordGivenKey(row.recordKey);
  Test.assertIsDeepEqual(result, row);

  fileDb.deactivate();
});

Test.define("FileDb can assign rows to collections", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenRecordData: (data) => {
      const result = new Set<string>();

      result.add("testset1");
      result.add("testset2");

      return result;
    },
    metricsGivenRecordData: (data) => ({}),
  });
  fileDb.activate();

  const row = await fileDb.writeRecord({
    message: "hello world",
  });

  Test.assert(row.tagKeys.hasValue("testset1"));
  Test.assert(row.tagKeys.hasValue("testset2"));

  fileDb.deactivate();
});

Test.define("FileDb can assign values by index", async () => {
  const fileDb = new FileDb<any>({
    adapters: FileDbAdapters.ofMemory(),
    tagKeysGivenRecordData: (data) => new Set(),
    metricsGivenRecordData: (data) => {
      const result: Dict<number> = {};

      result.size = 5;
      result.views = 23;

      return result;
    },
  });
  fileDb.activate();

  const row = await fileDb.writeRecord({
    message: "hello world",
  });

  Test.assert(row.metricValues.toOptionalValueGivenKey("size") === 5);
  Test.assert(row.metricValues.toOptionalValueGivenKey("views") === 23);

  fileDb.deactivate();
});
