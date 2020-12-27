import { LocalDirectory } from "@anderjason/node-filesystem";
import { Test } from "@anderjason/tests";
import { LocalFileAdapter } from "./";

// TODO use cross-platform directory path

// Test.define("LocalFileAdapter can write and read a string", async () => {
//   const directory = LocalDirectory.givenAbsolutePath(
//     "/mnt/c/Users/Jason/Desktop/test"
//   );

//   const adapter = new LocalFileAdapter<string>({
//     directory,
//     valueGivenBuffer: (buffer) => {
//       return buffer.toString();
//     },
//     bufferGivenValue: (value) => {
//       return Buffer.from(value);
//     },
//   });
//   adapter.activate();

//   await adapter.writeValue("message", "hello world");

//   const actual = await adapter.toOptionalValueGivenKey("message");
//   Test.assertIsEqual(actual, "hello world");

//   await directory.deleteDirectory();
// });
