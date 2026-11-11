import type { CrawlSnapshot } from "../../domain/crawl-snapshot";
import type { SnapshotRepository } from "../../application/ports/snapshot-repository";
import type { Database } from "./database";
import { mapSnapshotRow } from "./map-snapshot-row";

// liskov substitution principle, open/closed principle, dependency inversion principle
export class PostgresSnapshotRepository
  implements SnapshotRepository
{
  // dependency inversion principle
  constructor(private readonly database: Database) {}

  // single responsibility principle
  async save(snapshot: CrawlSnapshot): Promise<void> {
    await this.database`
      INSERT INTO crawl_snapshots (
        id,
        captured_at,
        entries
      )
      VALUES (
        ${snapshot.id},
        ${snapshot.capturedAt},
        ${JSON.stringify(snapshot.entries)}::jsonb
      )
    `;
  }

  async findById(id: string): Promise<CrawlSnapshot | null> {
    const rows = await this.database`
      SELECT id, captured_at, entries
      FROM crawl_snapshots
      WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return null;
    }

    return mapSnapshotRow(rows[0]);
  }
}