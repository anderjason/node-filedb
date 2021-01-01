"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const PropsObject_1 = require("../PropsObject");
class Tag extends PropsObject_1.PropsObject {
    constructor(props) {
        super(props);
        this.entryKeys = new Set();
        if (props.tagKey == null) {
            throw new Error("tagKey is required");
        }
        if (props.adapter == null) {
            throw new Error("adapter is required");
        }
        this.key = props.tagKey;
        this.tagPrefix = props.tagKey.split(":")[0];
    }
    async load() {
        const portableTag = await this.props.adapter.toOptionalValueGivenKey(this.props.tagKey);
        if (portableTag == null) {
            throw new Error(`Tags adapter returned null for tagKey '${this.props.tagKey}'`);
        }
        this.entryKeys = new Set(portableTag.entryKeys);
    }
    async save() {
        if (this.entryKeys.size > 0) {
            await this.props.adapter.writeValue(this.props.tagKey, this.toPortableObject());
        }
        else {
            await this.props.adapter.deleteKey(this.props.tagKey);
        }
    }
    toPortableObject() {
        return {
            key: this.key,
            entryKeys: Array.from(this.entryKeys || new Set()),
        };
    }
}
exports.Tag = Tag;
//# sourceMappingURL=index.js.map