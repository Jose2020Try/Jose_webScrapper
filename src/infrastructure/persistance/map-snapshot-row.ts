import { z } from "zod";
import type { CrawlSnapshot } from "../../domain/crawl-snapshot";
import { entrySchema } from "../../contracts/entry-schema";

const snapshotRowSchema = z.object({
  id: z.string().uuid(),
  captured_at: z.coerce.date(),
  entries: z.array(entrySchema).length(30),
});

export function mapSnapshotRow(value: unknown): CrawlSnapshot {
  const row = snapshotRowSchema.parse(value);

  return {
    id: row.id,
    capturedAt: row.captured_at.toISOString(),
    entries: row.entries,
  };
}