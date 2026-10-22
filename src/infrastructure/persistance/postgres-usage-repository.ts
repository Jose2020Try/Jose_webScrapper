import type {
    UsageEvent,
    UsageRepository,
  } from "../../application/ports/usage-repository";
  import type { Database } from "./database";
  
  export class PostgresUsageRepository implements UsageRepository {
    constructor(private readonly database: Database) {}
  
    async save(event: UsageEvent): Promise<void> {
      await this.database`
        INSERT INTO usage_events (
          requested_at,
          operation,
          applied_filter,
          snapshot_id,
          result_count,
          duration_ms,
          status
        )
        VALUES (
          ${event.requestedAt},
          ${event.operation},
          ${event.filter},
          ${event.snapshotId},
          ${event.resultCount},
          ${event.durationMs},
          ${event.status}
        )
      `;
    }
  }