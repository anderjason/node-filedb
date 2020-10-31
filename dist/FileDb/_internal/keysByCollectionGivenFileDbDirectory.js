"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keysByCollectionGivenFileDbDirectory = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
const util_1 = require("@anderjason/util");
const node_crypto_1 = require("@anderjason/node-crypto");
async function keysByCollectionGivenFileDbDirectory(directory, encryptionKey) {
    const result = new Map();
    const collectionsDirectory = node_filesystem_1.LocalDirectory.givenRelativePath(directory, "collections");
    await collectionsDirectory.createDirectory();
    const collectionFiles = await collectionsDirectory.toDescendantFiles();
    await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(collectionFiles, async (collectionFile) => {
        if (collectionFile.toExtension() !== ".json") {
            return;
        }
        const rawFileContents = await collectionFile.toContentString();
        let contents;
        if (encryptionKey != null) {
            contents = JSON.parse(node_crypto_1.EncryptedData.givenEncryptedHexString(rawFileContents).toDecryptedString(encryptionKey));
        }
        else {
            contents = JSON.parse(rawFileContents);
        }
        const keys = new Set(contents.keys);
        result.set(contents.collection, keys);
    });
    return result;
}
exports.keysByCollectionGivenFileDbDirectory = keysByCollectionGivenFileDbDirectory;
//# sourceMappingURL=keysByCollectionGivenFileDbDirectory.js.map