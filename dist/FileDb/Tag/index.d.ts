import { ObservableSet } from "@anderjason/observable";
import { FileDbAdapter, PortableTag } from "../../FileDbAdapters";
import { PropsObject } from "../../PropsObject";
export interface TagProps {
    tagKey: string;
    adapter: FileDbAdapter<PortableTag>;
}
export declare class Tag extends PropsObject<TagProps> {
    readonly recordKeys: ObservableSet<string>;
    load(): Promise<void>;
    save(): Promise<void>;
}
