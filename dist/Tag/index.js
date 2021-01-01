"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
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
        if (this.entryKeys.count > 0) {
            const contents = {
                tagKey: this.props.tagKey,
                entryKeys: this.entryKeys.toArray(),
            };
            await this.props.adapter.writeValue(this.props.tagKey, contents);
        }
        else {
            await this.props.adapter.deleteKey(this.props.tagKey);
        }
    }
    toObject() {
        return {
            tagKey: this.tagKey,
            entryKeys: this.entryKeys.toArray(),
        };
    }
}
exports.Tag = Tag;
//# sourceMappingURL=index.js.map