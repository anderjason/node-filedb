"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rowKeysGivenFileDbDirectory = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
async function rowKeysGivenFileDbDirectory(directory) {
    const isAccessible = await directory.isAccessible();
    if (!isAccessible) {
        return [];
    }
    const dataDirectory = node_filesystem_1.LocalDirectory.givenRelativePath(directory, "data");
    await dataDirectory.createDirectory();
    const files = await dataDirectory.toDescendantFiles();
    const result = files
        .filter((file) => file.toExtension() === ".json")
        .map((file) => file.toFilenameWithoutExtension());
    return result;
}
exports.rowKeysGivenFileDbDirectory = rowKeysGivenFileDbDirectory;
//# sourceMappingURL=rowKeysGivenFileDbDirectory.js.map