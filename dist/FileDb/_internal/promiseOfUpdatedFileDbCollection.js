"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseOfUpdatedFileDbCollection = void 0;
const localFileGivenFileDbCollectionKey_1 = require("./localFileGivenFileDbCollectionKey");
const node_crypto_1 = require("@anderjason/node-crypto");
async function promiseOfUpdatedFileDbCollection(directory, collectionKey, keys, encryptionKey) {
    const collectionFile = localFileGivenFileDbCollectionKey_1.localFileGivenFileDbCollectionKey(directory, collectionKey);
    if (keys != null && keys.size > 0) {
        const contents = JSON.stringify({
            collection: collectionKey,
            keys: Array.from(keys),
        });
        let rawFileContents;
        if (encryptionKey != null) {
            rawFileContents = node_crypto_1.EncryptedData.givenDecryptedStringAndKey(contents, encryptionKey).toEncryptedHexString();
        }
        else {
            rawFileContents = contents;
        }
        await collectionFile.writeFile(rawFileContents);
    }
    else {
        await collectionFile.deleteFile();
    }
}
exports.promiseOfUpdatedFileDbCollection = promiseOfUpdatedFileDbCollection;
//# sourceMappingURL=promiseOfUpdatedFileDbCollection.js.map