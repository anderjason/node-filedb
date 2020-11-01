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
            collectionsAdapter: new MemoryAdapter_1.MemoryAdapter(),
            dataAdapter: new MemoryAdapter_1.MemoryAdapter(),
            indexesAdapter: new MemoryAdapter_1.MemoryAdapter(),
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
            collectionsAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "collections"),
                bufferGivenValue,
                valueGivenBuffer,
            }),
            dataAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "data"),
                bufferGivenValue,
                valueGivenBuffer,
            }),
            indexesAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "indexes"),
                bufferGivenValue,
                valueGivenBuffer,
            }),
        });
    }
    onActivate() {
        this.addActor(this.props.collectionsAdapter);
        this.addActor(this.props.dataAdapter);
        this.addActor(this.props.indexesAdapter);
    }
}
exports.FileDbAdapters = FileDbAdapters;
//# sourceMappingURL=index.js.map