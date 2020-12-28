import { ObservableSet } from "@anderjason/observable";
import { FileDbAdapter } from "../../FileDbAdapters";
import { PropsObject } from "../../PropsObject";
import { PortableTag } from "../Types";
export interface TagProps {
    tagKey: string;
    adapter: FileDbAdapter<PortableTag>;
}
export declare class Tag extends PropsObject<TagProps> {
    readonly entryKeys: ObservableSet<string>;
    load(): Promise<void>;
    save(): Promise<void>;
}
