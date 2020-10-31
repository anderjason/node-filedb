"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.valuesByKeyByIndexGivenFileDbDirectory = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
const util_1 = require("@anderjason/util");
const node_crypto_1 = require("@anderjason/node-crypto");
async function valuesByKeyByIndexGivenFileDbDirectory(directory, encryptionKey) {
    const result = new Map();
    const indexesDirectory = node_filesystem_1.LocalDirectory.givenRelativePath(directory, "indexes");
    await indexesDirectory.createDirectory();
    const indexFiles = await indexesDirectory.toDescendantFiles();
    await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(indexFiles, async (indexFile) => {
        if (indexFile.toExtension() !== ".json") {
            return;
        }
        const rawFileContents = await indexFile.toContentString();
        let contents;
        if (encryptionKey != null) {
            contents = JSON.parse(node_crypto_1.EncryptedData.givenEncryptedHexString(rawFileContents).toDecryptedString(encryptionKey));
        }
        else {
            contents = JSON.parse(rawFileContents);
        }
        const valuesByKey = new Map(Object.entries(contents.valuesByKey));
        result.set(contents.index, valuesByKey);
    });
    return result;
}
exports.valuesByKeyByIndexGivenFileDbDirectory = valuesByKeyByIndexGivenFileDbDirectory;
//# sourceMappingURL=valuesByKeyByIndexGivenFileDbDirectory.js.map