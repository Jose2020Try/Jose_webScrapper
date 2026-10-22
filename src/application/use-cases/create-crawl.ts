import type { CrawlSnapshot } from "../../domain/crawl-snapshot";
import type { EntrySource } from "../ports/entry-source";
import type { SnapshotRepository } from "../ports/snapshot-repository";
import type { UsageRepository } from "../ports/usage-repository";
import { runWithUsage } from "../services/run-with-usage";

export interface CreateCrawlDependencies {
  source: EntrySource;
  snapshots: SnapshotRepository;
  usage: UsageRepository;
  now: () => Date;
  newId: () => string;
}

export class CreateCrawl {
  constructor(
    private readonly dependencies: CreateCrawlDependencies,
  ) {}

  async execute(): Promise<CrawlSnapshot> {
    const { source, snapshots, now, newId } = this.dependencies;

    return runWithUsage(
      this.dependencies,
      { operation: "crawl", filter: null },
      async () => {
        const entries = await source.getEntries();

        const snapshot: CrawlSnapshot = {
          id: newId(),
          capturedAt: now().toISOString(),
          entries,
        };

        await snapshots.save(snapshot);

        return {
          value: snapshot,
          snapshotId: snapshot.id,
          resultCount: entries.length,
        };
      },
    );
  }
}