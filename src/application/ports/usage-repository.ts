import type { EntryFilter } from "../../domain/entry";

export interface UsageEvent {
  readonly requestedAt: string;
  readonly operation: "crawl" | "filter";
  readonly filter: EntryFilter | null;
  readonly snapshotId: string | null;
  readonly resultCount: number | null;
  readonly durationMs: number;
  readonly status: "success" | "error";
}

export interface UsageRepository {
  save(event: UsageEvent): Promise<void>;
}