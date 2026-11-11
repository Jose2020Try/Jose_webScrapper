import type { CrawlSnapshot } from "../../domain/crawl-snapshot";

// interface segregation principle, dependency inversion principle
export interface SnapshotRepository {
  save(snapshot: CrawlSnapshot): Promise<void>;

  findById(id: string): Promise<CrawlSnapshot | null>;
}
