"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDbAdapters = void 0;
const node_filesystem_1 = require("@anderjason/node-filesystem");
const skytree_1 = require("skytree");
const LocalFileAdapter_1 = require("../LocalFileAdapter");
const MemoryAdapter_1 = require("../MemoryAdapter");
const bufferGivenPortableEntry_1 = require("./_internal/bufferGivenPortableEntry");
const bufferGivenPortableMetric_1 = require("./_internal/bufferGivenPortableMetric");
const bufferGivenPortableTag_1 = require("./_internal/bufferGivenPortableTag");
const keyGivenPortableEntry_1 = require("./_internal/keyGivenPortableEntry");
const keyGivenPortableMetric_1 = require("./_internal/keyGivenPortableMetric");
const keyGivenPortableTag_1 = require("./_internal/keyGivenPortableTag");
const portableEntryResultGivenBuffer_1 = require("./_internal/portableEntryResultGivenBuffer");
const portableMetricResultGivenBuffer_1 = require("./_internal/portableMetricResultGivenBuffer");
const portableTagResultGivenBuffer_1 = require("./_internal/portableTagResultGivenBuffer");
class FileDbAdapters extends skytree_1.Actor {
    constructor(props) {
        super(props);
        this.tagsAdapter = props.tagsAdapter;
        this.metricsAdapter = props.metricsAdapter;
        this.entriesAdapter = props.entriesAdapter;
    }
    static ofMemory() {
        return new FileDbAdapters({
            tagsAdapter: new MemoryAdapter_1.MemoryAdapter(),
            entriesAdapter: new MemoryAdapter_1.MemoryAdapter(),
            metricsAdapter: new MemoryAdapter_1.MemoryAdapter(),
        });
    }
    static givenDirectory(directory) {
        return new FileDbAdapters({
            tagsAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "tags"),
                keyGivenValue: keyGivenPortableTag_1.keyGivenPortableTag,
                bufferGivenValue: bufferGivenPortableTag_1.bufferGivenPortableTag,
                valueGivenBuffer: portableTagResultGivenBuffer_1.portableTagResultGivenBuffer,
            }),
            entriesAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "entries"),
                keyGivenValue: keyGivenPortableEntry_1.keyGivenPortableEntry,
                bufferGivenValue: bufferGivenPortableEntry_1.bufferGivenPortableEntry,
                valueGivenBuffer: portableEntryResultGivenBuffer_1.portableEntryResultGivenBuffer,
            }),
            metricsAdapter: new LocalFileAdapter_1.LocalFileAdapter({
                directory: node_filesystem_1.LocalDirectory.givenRelativePath(directory, "metrics"),
                keyGivenValue: keyGivenPortableMetric_1.keyGivenPortableMetric,
                bufferGivenValue: bufferGivenPortableMetric_1.bufferGivenPortableMetric,
                valueGivenBuffer: portableMetricResultGivenBuffer_1.portableMetricResultGivenBuffer,
            }),
        });
    }
    onActivate() {
        this.addActor(this.tagsAdapter);
        this.addActor(this.entriesAdapter);
        this.addActor(this.metricsAdapter);
    }
}
exports.FileDbAdapters = FileDbAdapters;
//# sourceMappingURL=index.js.map