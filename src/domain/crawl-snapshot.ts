import type { Entry } from "./entry";

export interface CrawlSnapshot {
  readonly id: string;
  readonly capturedAt: string;
  readonly entries: readonly Entry[];
}