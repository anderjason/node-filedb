"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDbAdapters = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
const skytree_1 = require("skytree");
const LocalFileAdapter_1 = require("../LocalFileAdapter");
const MemoryAdapter_1 = require("../MemoryAdapter");
class FileDbAdapters extends skytree_1.Actor {
    static ofMemory() {
        return new FileDbAdapters({
            tagsAdapter: new MemoryAdapter_1.MemoryAdapter(),
            entriesAdapter: new MemoryAdapter_1.MemoryAdapter(),
            metricsAdapter: new MemoryAdapter_1.MemoryAdapter(),
        });
    }
    static givenDirectory(directory) {
        const valueGivenBuffer = (buffer) => {
            return JSON.parse(buffer.toString());
        };
        const bufferGivenValue = (value) => {
            return Buffer.from(JSON.stringify(value));
        };
        return new FileDbAdapters({
            tagsAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "tags"),
                bufferGivenValue,
                valueGivenBuffer,
            }),
            entriesAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "data"),
                bufferGivenValue,
                valueGivenBuffer,
            }),
            metricsAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "metrics"),
                bufferGivenValue,
                valueGivenBuffer,
            }),
        });
    }
    onActivate() {
        this.addActor(this.props.tagsAdapter);
        this.addActor(this.props.entriesAdapter);
        this.addActor(this.props.metricsAdapter);
    }
}
exports.FileDbAdapters = FileDbAdapters;
//# sourceMappingURL=index.js.map