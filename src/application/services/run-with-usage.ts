import type {
    UsageEvent,
    UsageRepository,
  } from "../ports/usage-repository";
  
  interface Dependencies {
    usage: UsageRepository;
    now: () => Date;
  }
  
  interface Operation {
    operation: UsageEvent["operation"];
    filter: UsageEvent["filter"];
  }
  
  interface OperationResult<T> {
    value: T;
    snapshotId: string | null;
    resultCount: number;
  }
  
  type Outcome<T> =
    | { ok: true; result: OperationResult<T> }
    | { ok: false; error: unknown };
  
  export async function runWithUsage<T>(
    dependencies: Dependencies,
    operation: Operation,
    action: () => Promise<OperationResult<T>>,
  ): Promise<T> {
    const { usage, now } = dependencies;
    const requestedAt = now();
  
    let outcome: Outcome<T>;
  
    try {
      outcome = {
        ok: true,
        result: await action(),
      };
    } catch (error) {
      outcome = { ok: false, error };
    }
  
    const durationMs = Math.max(
      0,
      now().getTime() - requestedAt.getTime(),
    );
  
    try {
      await usage.save({
        requestedAt: requestedAt.toISOString(),
        operation: operation.operation,
        filter: operation.filter,
        snapshotId: outcome.ok ? outcome.result.snapshotId : null,
        resultCount: outcome.ok ? outcome.result.resultCount : null,
        durationMs,
        status: outcome.ok ? "success" : "error",
      });
    } catch (loggingError) {
      if (!outcome.ok) {
        throw new AggregateError(
          [outcome.error, loggingError],
          "The operation and its usage recording both failed",
        );
      }
  
      throw loggingError;
    }
  
    if (!outcome.ok) {
      throw outcome.error;
    }
  
    return outcome.result.value;
  }