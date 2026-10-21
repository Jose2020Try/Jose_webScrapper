import type { CrawlSnapshot } from "../../domain/crawl-snapshot";

export interface SnapshotRepository {
  save(snapshot: CrawlSnapshot): Promise<void>;

  findById(id: string): Promise<CrawlSnapshot | null>;
}