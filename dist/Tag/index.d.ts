import { ObservableSet } from "@anderjason/observable";
import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableTag } from "../FileDb/Types";
export interface TagProps {
    tagKey: string;
    adapter: FileDbAdapter<PortableTag>;
}
export declare class Tag extends PropsObject<TagProps> {
    readonly tagPrefix: string;
    readonly tagKey: string;
    readonly entryKeys: ObservableSet<string>;
    constructor(props: TagProps);
    load(): Promise<void>;
    save(): Promise<void>;
}
