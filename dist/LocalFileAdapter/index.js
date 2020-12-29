"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileAdapter = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const node_filesystem_1 = require("@anderjason/node-filesystem");
const util_1 = require("@anderjason/util");
const skytree_1 = require("skytree");
const rename_1 = require("./_internal/rename");
class LocalFileAdapter extends skytree_1.Actor {
    async toKeys() {
        await this.props.directory.createDirectory();
        let files = await this.props.directory.toDescendantFiles();
        files = files.filter((file) => {
            return file.hasExtension([".json"]);
        });
        const result = await util_1.PromiseUtil.asyncValuesGivenArrayAndConverter(files, async (file) => {
            let buffer = await file.toContentBuffer();
            const portableValueResult = this.props.valueGivenBuffer(buffer);
            if (portableValueResult.shouldRewriteStorage == true) {
                buffer = this.props.bufferGivenValue(portableValueResult.value);
                await file.writeFile(buffer);
            }
            return this.props.keyGivenValue(portableValueResult.value);
        });
        return result;
    }
    async toValues() {
        await this.props.directory.createDirectory();
        let files = await this.props.directory.toDescendantFiles();
        files = files.filter((file) => {
            return file.hasExtension([".json"]);
        });
        const result = await util_1.PromiseUtil.asyncValuesGivenArrayAndConverter(files, async (file) => {
            let buffer = await file.toContentBuffer();
            const portableValueResult = this.props.valueGivenBuffer(buffer);
            if (portableValueResult.shouldRewriteStorage == true) {
                buffer = this.props.bufferGivenValue(portableValueResult.value);
                await file.writeFile(buffer);
            }
            return portableValueResult.value;
        });
        return result;
    }
    async toOptionalValueGivenKey(key) {
        const file = await this.fileGivenKey(key);
        const isAccessible = await file.isAccessible();
        if (!isAccessible) {
            return undefined;
        }
        let buffer = await file.toContentBuffer();
        const portableValueResult = this.props.valueGivenBuffer(buffer);
        if (portableValueResult.shouldRewriteStorage == true) {
            buffer = this.props.bufferGivenValue(portableValueResult.value);
            await file.writeFile(buffer);
        }
        return portableValueResult.value;
    }
    async writeValue(key, value) {
        const file = await this.fileGivenKey(key);
        await file.toDirectory().createDirectory();
        const buffer = this.props.bufferGivenValue(value);
        await file.writeFile(buffer);
    }
    async deleteKey(key) {
        const file = await this.fileGivenKey(key);
        const isAccessible = await file.isAccessible();
        if (!isAccessible) {
            return undefined;
        }
        await file.deleteFile();
    }
    oldFileGivenKey(key) {
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, key.slice(0, 3), `${key}.json`);
    }
    newFileGivenKey(key) {
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(key)
            .toHashedString()
            .slice(0, 16);
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, hash.slice(0, 1), hash.slice(1, 2), hash.slice(2, 3), `${hash}.json`);
    }
    async fileGivenKey(key) {
        const newFile = this.newFileGivenKey(key);
        const oldFile = this.oldFileGivenKey(key);
        const oldFileExists = await oldFile.isAccessible();
        if (oldFileExists == true) {
            console.log(`Renaming ${oldFile.toAbsolutePath()} to ${newFile.toAbsolutePath()}...`);
            await rename_1.rename(oldFile, newFile);
        }
        return newFile;
    }
}
exports.LocalFileAdapter = LocalFileAdapter;
//# sourceMappingURL=index.js.map