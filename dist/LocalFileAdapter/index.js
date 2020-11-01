"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileAdapter = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const node_filesystem_1 = require("@anderjason/node-filesystem");
const util_1 = require("@anderjason/util");
const skytree_1 = require("skytree");
class LocalFileAdapter extends skytree_1.Actor {
    async toKeys() {
        await this.props.directory.createDirectory();
        const files = await this.props.directory.toDescendantFiles();
        const result = files.map((file) => file.toFilenameWithoutExtension());
        return result;
    }
    async toValues() {
        const keys = await this.toKeys();
        const result = await util_1.PromiseUtil.asyncValuesGivenArrayAndConverter(keys, async (key) => {
            const value = await this.toOptionalValue(key);
            return value;
        });
        return result;
    }
    async toOptionalValue(key) {
        const file = this.fileGivenKey(key);
        const isAccessible = await file.isAccessible();
        if (!isAccessible) {
            return undefined;
        }
        const buffer = await file.toContentBuffer();
        return this.props.valueGivenBuffer(buffer);
    }
    async setValue(key, value) {
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
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(key)
            .toHashedString()
            .slice(0, 24);
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, hash.slice(0, 3), `${hash}.json`);
    }
}
exports.LocalFileAdapter = LocalFileAdapter;
//# sourceMappingURL=index.js.map