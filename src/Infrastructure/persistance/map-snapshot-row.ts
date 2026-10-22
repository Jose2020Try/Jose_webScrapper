import { z } from "zod";
import type { CrawlSnapshot } from "../../domain/crawl-snapshot";

const entrySchema = z.object({
  rank: z.number().int().positive(),
  title: z.string().trim().min(1),
  points: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
});

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