export interface Story {
    id: string;
    title: string;
    name: string;
    kind: string;
    tags: string[];
}

export interface StorybookIndex {
    v: number;
    entries: Record<string, StorybookEntry>;
}

export interface StorybookEntry {
    id: string;
    title: string;
    name: string;
    type?: string;
    tags?: string[];
}
