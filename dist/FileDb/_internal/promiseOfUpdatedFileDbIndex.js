"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseOfUpdatedFileDbIndex = void 0;
const localFileGivenFileDbIndexKey_1 = require("./localFileGivenFileDbIndexKey");
const node_crypto_1 = require("@anderjason/node-crypto");
async function promiseOfUpdatedFileDbIndex(directory, indexKey, valuesByKey, encryptionKey) {
    const indexFile = localFileGivenFileDbIndexKey_1.localFileGivenFileDbIndexKey(directory, indexKey);
    if (valuesByKey != null && valuesByKey.size > 0) {
        const obj = {};
        for (let [key, value] of valuesByKey) {
            obj[key] = value;
        }
        const contents = JSON.stringify({
            index: indexKey,
            valuesByKey: obj,
        });
        let rawFileContents;
        if (encryptionKey != null) {
            rawFileContents = node_crypto_1.EncryptedData.givenDecryptedStringAndKey(contents, encryptionKey).toEncryptedHexString();
        }
        else {
            rawFileContents = contents;
        }
        await indexFile.writeFile(rawFileContents);
    }
    else {
        await indexFile.deleteFile();
    }
}
exports.promiseOfUpdatedFileDbIndex = promiseOfUpdatedFileDbIndex;
//# sourceMappingURL=promiseOfUpdatedFileDbIndex.js.map