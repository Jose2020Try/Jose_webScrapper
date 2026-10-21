export interface Entry {
    readonly rank: number;
    readonly title: string;
    readonly points: number;
    readonly comments: number;
  }
  
  export type EntryFilter = "all" | "long-title" | "short-title";