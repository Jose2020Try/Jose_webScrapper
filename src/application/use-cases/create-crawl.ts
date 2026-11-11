import type { CrawlSnapshot } from "../../domain/crawl-snapshot";
import type { EntrySource } from "../ports/entry-source";
import type { SnapshotRepository } from "../ports/snapshot-repository";
import type { UsageRepository } from "../ports/usage-repository";
import { runWithUsage } from "../services/run-with-usage";

// dependency inversion principle, interface segregation principle
export interface CreateCrawlDependencies {
  source: EntrySource;
  snapshots: SnapshotRepository;
  usage: UsageRepository;
  now: () => Date;
  newId: () => string;
}

// single responsibility principle, dependency inversion principle
export class CreateCrawl {
  constructor(
    private readonly dependencies: CreateCrawlDependencies,
  ) {}

  // single responsibility principle
  async execute(): Promise<CrawlSnapshot> {
    const { source, snapshots, now, newId } = this.dependencies;

    return runWithUsage(
      this.dependencies,
      { operation: "crawl", filter: null },
      async () => {
        // dependency inversion principle, liskov substitution principle
        const entries = await source.getEntries();

        const snapshot: CrawlSnapshot = {
          id: newId(),
          capturedAt: now().toISOString(),
          entries,
        };

        // dependency inversion principle, liskov substitution principle
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
