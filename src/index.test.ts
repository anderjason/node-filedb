import { Test } from "@anderjason/tests";
import "./FileDb/index.test";
import "./MemoryAdapter/index.test";
import "./LocalFileAdapter/index.test";

Test.runAll()
  .then(() => {
    console.log("Tests complete");
  })
  .catch((err) => {
    console.error(err);
    console.error("Tests failed");
  });
