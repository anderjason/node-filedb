import { Test } from "@anderjason/tests";
import { MemoryAdapter } from "./";

Test.define("MemoryAdapter can write and read a string", async () => {
  const adapter = new MemoryAdapter<string>();
  adapter.activate();

  await adapter.writeValue("message", "hello world");

  const actual = await adapter.toOptionalValueGivenKey("message");
  Test.assertIsEqual(actual, "hello world");

  adapter.deactivate();
});
