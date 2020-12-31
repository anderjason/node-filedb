"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const observable_1 = require("@anderjason/observable");
const PropsObject_1 = require("../PropsObject");
class Tag extends PropsObject_1.PropsObject {
    constructor(props) {
        super(props);
        this.entryKeys = observable_1.ObservableSet.ofEmpty();
        if (props.tagKey == null) {
            throw new Error("tagKey is required");
        }
        if (props.adapter == null) {
            throw new Error("adapter is required");
        }
        this.tagKey = props.tagKey;
        this.tagPrefix = props.tagKey.split(":")[0];
    }
    async load() {
        const portableTag = await this.props.adapter.toOptionalValueGivenKey(this.props.tagKey);
        if (portableTag == null) {
            throw new Error(`Tags adapter returned null for tagKey '${this.props.tagKey}'`);
        }
        this.entryKeys.sync(portableTag.entryKeys);
    }
    async save() {
        const hash = node_crypto_1.UnsaltedHash.givenUnhashedString(this.props.tagKey)
            .toHashedString()
            .slice(0, 24);
        if (this.entryKeys.count > 0) {
            const contents = {
                tagKey: this.props.tagKey,
                entryKeys: this.entryKeys.toArray(),
            };
            await this.props.adapter.writeValue(hash, contents);
        }
        else {
            await this.props.adapter.deleteKey(hash);
        }
    }
}
exports.Tag = Tag;
//# sourceMappingURL=index.js.map