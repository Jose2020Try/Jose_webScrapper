import type { Entry, EntryFilter } from "../../domain/entry";
import { filterEntries } from "../../domain/filter-entries";
import type { SnapshotRepository } from "../ports/snapshot-repository";
import type { UsageRepository } from "../ports/usage-repository";
import { runWithUsage } from "../services/run-with-usage";

export interface GetFilteredEntriesDependencies {
  snapshots: SnapshotRepository;
  usage: UsageRepository;
  now: () => Date;
}

export interface FilteredEntriesResult {
  snapshotId: string;
  capturedAt: string;
  filter: EntryFilter;
  entries: Entry[];
}

export class SnapshotNotFoundError extends Error {
  constructor() {
    super("Snapshot not found");
    this.name = "SnapshotNotFoundError";
  }
}

export class GetFilteredEntries {
  constructor(
    private readonly dependencies: GetFilteredEntriesDependencies,
  ) {}

  async execute(
    snapshotId: string,
    filter: EntryFilter,
  ): Promise<FilteredEntriesResult> {
    return runWithUsage(
      this.dependencies,
      { operation: "filter", filter },
      async () => {
        const snapshot =
          await this.dependencies.snapshots.findById(snapshotId);

        if (!snapshot) {
          throw new SnapshotNotFoundError();
        }

        const entries = filterEntries(snapshot.entries, filter);

        return {
          value: {
            snapshotId: snapshot.id,
            capturedAt: snapshot.capturedAt,
            filter,
            entries,
          },
          snapshotId: snapshot.id,
          resultCount: entries.length,
        };
      },
    );
  }
}