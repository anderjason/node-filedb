import { FileDbAdapter } from "../FileDbAdapters";
import { PropsObject } from "../PropsObject";
import { PortableTag } from "../FileDb/Types";
export interface TagProps {
    tagKey: string;
    adapter: FileDbAdapter<PortableTag>;
}
export declare class Tag extends PropsObject<TagProps> {
    readonly tagPrefix: string;
    readonly key: string;
    entryKeys: Set<string>;
    constructor(props: TagProps);
    load(): Promise<void>;
    save(): Promise<void>;
    toPortableObject(): PortableTag;
}
