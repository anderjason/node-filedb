"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileAdapter = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
const util_1 = require("@anderjason/util");
const skytree_1 = require("skytree");
class LocalFileAdapter extends skytree_1.Actor {
    async toKeys() {
        await this.props.directory.createDirectory();
        const files = await this.props.directory.toDescendantFiles();
        const result = files
            .filter((file) => file.hasExtension([".json"]))
            .map((file) => file.toFilenameWithoutExtension());
        return result;
    }
    async toValues() {
        await this.props.directory.createDirectory();
        let files = await this.props.directory.toDescendantFiles();
        files = files.filter((file) => {
            return file.hasExtension([".json"]);
        });
        const result = await util_1.PromiseUtil.asyncValuesGivenArrayAndConverter(files, async (file) => {
            const buffer = await file.toContentBuffer();
            return this.props.valueGivenBuffer(buffer);
        });
        return result;
    }
    async toOptionalValueGivenKey(key) {
        const file = this.fileGivenKey(key);
        const isAccessible = await file.isAccessible();
        if (!isAccessible) {
            return undefined;
        }
        const buffer = await file.toContentBuffer();
        return this.props.valueGivenBuffer(buffer);
    }
    async writeValue(key, value) {
        const file = this.fileGivenKey(key);
        await file.toDirectory().createDirectory();
        const buffer = this.props.bufferGivenValue(value);
        await file.writeFile(buffer);
    }
    async deleteKey(key) {
        const file = this.fileGivenKey(key);
        const isAccessible = await file.isAccessible();
        if (!isAccessible) {
            return undefined;
        }
        await file.deleteFile();
    }
    fileGivenKey(key) {
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, key.slice(0, 3), `${key}.json`);
    }
}
exports.LocalFileAdapter = LocalFileAdapter;
//# sourceMappingURL=index.js.map