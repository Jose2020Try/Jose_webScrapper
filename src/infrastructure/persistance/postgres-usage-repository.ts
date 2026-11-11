import type {
    UsageEvent,
    UsageRepository,
  } from "../../application/ports/usage-repository";
  import type { Database } from "./database";
  
  // liskov substitution principle, open/closed principle, dependency inversion principle
  export class PostgresUsageRepository implements UsageRepository {
    // dependency inversion principle
    constructor(private readonly database: Database) {}
  
    // single responsibility principle
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