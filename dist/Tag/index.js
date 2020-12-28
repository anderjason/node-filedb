"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const node_crypto_1 = require("@anderjason/node-crypto");
const observable_1 = require("@anderjason/observable");
const PropsObject_1 = require("../PropsObject");
class Tag extends PropsObject_1.PropsObject {
    constructor() {
        super(...arguments);
        this.entryKeys = observable_1.ObservableSet.ofEmpty();
    }
    async load() {
        const portableTag = await this.props.adapter.toOptionalValueGivenKey(this.props.tagKey);
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