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
        try {
            await this.props.directory.createDirectory();
        }
        catch (_a) {
            //
        }
        let keys;
        const files = await this.getDataFiles();
        keys = await util_1.PromiseUtil.asyncValuesGivenArrayAndConverter(files, async (file) => {
            let buffer = await file.toContentBuffer();
            const portableValueResult = this.props.valueGivenBuffer(buffer);
            if (portableValueResult.shouldRewriteStorage == true) {
                buffer = this.props.bufferGivenValue(portableValueResult.value);
                await file.writeFile(buffer);
            }
            return portableValueResult.value.key;
        });
        this._keys.sync(keys);
        this._isReady.setValue(true);
    }
    async toValues() {
        try {
            await this.props.directory.createDirectory();
        }
        catch (_a) {
            //
        }
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
        try {
            await file.toDirectory().createDirectory();
        }
        catch (_a) {
            //
        }
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
    async fileGivenKey(key) {
        if (key == null) {
            throw new Error("Key is required");
        }
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(key)
            .toHashedString()
            .slice(0, 16);
        return node_filesystem_1.LocalFile.givenRelativePath(this.props.directory, hash.slice(0, 1), hash.slice(1, 2), hash.slice(2, 3), `${hash}.json`);
    }
    async rebuild() {
        const files = await this.getDataFiles();
        await util_1.PromiseUtil.asyncSequenceGivenArrayAndCallback(files, async (file) => {
            console.log(file.toAbsolutePath());
            let buffer = await file.toContentBuffer();
            const portableValueResult = this.props.valueGivenBuffer(buffer);
            const key = portableValueResult.value.key;
            buffer = this.props.bufferGivenValue(portableValueResult.value);
            await file.writeFile(buffer);
            const expectedFile = await this.fileGivenKey(key);
            await rename_1.rename(file, expectedFile);
        });
    }
}
exports.LocalFileAdapter = LocalFileAdapter;
//# sourceMappingURL=index.js.map