"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileAdapter = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const node_filesystem_1 = require("@anderjason/node-filesystem");
const observable_1 = require("@anderjason/observable");
const util_1 = require("@anderjason/util");
const skytree_1 = require("skytree");
const rename_1 = require("./_internal/rename");
class LocalFileAdapter extends skytree_1.Actor {
    constructor() {
        super(...arguments);
        this._keys = observable_1.ObservableSet.ofEmpty();
        this._isReady = observable_1.Observable.givenValue(false, observable_1.Observable.isStrictEqual);
        this.isReady = observable_1.ReadOnlyObservable.givenObservable(this._isReady);
    }
    onActivate() {
        this.load();
    }
    async toKeys() {
        if (this.isReady.value == true) {
            return this._keys.toArray();
        }
        await this._isReady.toPromise((v) => v == true);
        return this._keys.toArray();
    }
    async load() {
        await this.props.directory.createDirectory();
        let keys;
        const files = await this.getDataFiles();
        keys = await util_1.PromiseUtil.asyncValuesGivenArrayAndConverter(files, async (file) => {
            let buffer = await file.toContentBuffer();
            const portableValueResult = this.props.valueGivenBuffer(buffer);
            if (portableValueResult.shouldRewriteStorage == true) {
                buffer = this.props.bufferGivenValue(portableValueResult.value);
                await file.writeFile(buffer);
            }
            return this.props.keyGivenValue(portableValueResult.value);
        });
        this._keys.sync(keys);
        this._isReady.setValue(true);
    }
    async toValues() {
        await this.props.directory.createDirectory();
        const files = await this.getDataFiles();
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
        if (key == null) {
            throw new Error("Key is required");
        }
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
        if (key == null) {
            throw new Error("Key is required");
        }
        const file = await this.fileGivenKey(key);
        await file.toDirectory().createDirectory();
        const buffer = this.props.bufferGivenValue(value);
        await file.writeFile(buffer);
        this._keys.addValue(key);
    }
    async deleteKey(key) {
        if (key == null) {
            throw new Error("Key is required");
        }
        const file = await this.fileGivenKey(key);
        const isAccessible = await file.isAccessible();
        if (!isAccessible) {
            return undefined;
        }
        await file.deleteFile();
        await this._keys.removeValue(key);
    }
    async getDataFiles() {
        let files = await this.props.directory.toDescendantFiles();
        files = files.filter((file) => {
            return file.hasExtension([".json"]);
        });
        return files;
    }
    oldFileGivenKey(key) {
        if (key == null) {
            throw new Error("Key is required");
        }
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, key.slice(0, 3), `${key}.json`);
    }
    oldFile2GivenKey(key) {
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(key)
            .toHashedString()
            .slice(0, 24);
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, hash.slice(0, 3), `${hash}.json`);
    }
    newFileGivenKey(key) {
        if (key == null) {
            throw new Error("Key is required");
        }
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(key)
            .toHashedString()
            .slice(0, 16);
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, hash.slice(0, 1), hash.slice(1, 2), hash.slice(2, 3), `${hash}.json`);
    }
    async fileGivenKey(key) {
        if (key == null) {
            throw new Error("Key is required");
        }
        const newFile = this.newFileGivenKey(key);
        const oldFile = this.oldFileGivenKey(key);
        const oldFileExists = await oldFile.isAccessible();
        if (oldFileExists == true) {
            console.log(`Renaming ${oldFile.toAbsolutePath()} to ${newFile.toAbsolutePath()}...`);
            await newFile.toDirectory().createDirectory();
            await rename_1.rename(oldFile, newFile);
        }
        else {
            const oldFile2 = this.oldFile2GivenKey(key);
            const oldFile2Exists = await oldFile2.isAccessible();
            if (oldFile2Exists == true) {
                console.log(`Renaming ${oldFile2.toAbsolutePath()} to ${newFile.toAbsolutePath()}...`);
                await newFile.toDirectory().createDirectory();
                await rename_1.rename(oldFile2, newFile);
            }
        }
        return newFile;
    }
}
exports.LocalFileAdapter = LocalFileAdapter;
//# sourceMappingURL=index.js.map