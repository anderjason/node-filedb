import { Test } from "@anderjason/tests";
import { MemoryAdapter } from "./";

Test.define("MemoryAdapter can write and read a string", async () => {
  class TestType {
    key: string;
  }

  const adapter = new MemoryAdapter<TestType>();
  adapter.activate();

  await adapter.writeValue("message", { key: "key123" });

  const actual = await adapter.toOptionalValueGivenKey("message");
  Test.assertIsEqual(actual.key, "key123");

  adapter.deactivate();
});
