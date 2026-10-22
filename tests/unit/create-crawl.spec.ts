import { expect, test } from "@playwright/test";
import type { Entry } from "../../src/domain/entry";
import type { CrawlSnapshot } from "../../src/domain/crawl-snapshot";
import type { UsageEvent } from "../../src/application/ports/usage-repository";
import { EntrySourceError } from "../../src/application/ports/entry-source";
import {
  CreateCrawl,
  type CreateCrawlDependencies,
} from "../../src/application/use-cases/create-crawl";

const SNAPSHOT_ID = "d8bd5974-33d0-4e76-b680-77ef854c415d";
const TIMESTAMP = "2026-10-22T15:30:00.000Z";

function setup(
  overrides: Partial<CreateCrawlDependencies> = {},
) {
  const entries: Entry[] = Array.from(
    { length: 30 },
    (_, index) => ({
      rank: index + 1,
      title: `Story ${index + 1}`,
      points: 10,
      comments: 2,
    }),
  );

  const savedSnapshots: CrawlSnapshot[] = [];
  const savedEvents: UsageEvent[] = [];
  let sourceCalls = 0;

  const dependencies: CreateCrawlDependencies = {
    source: {
      async getEntries() {
        sourceCalls += 1;
        return entries;
      },
    },
    snapshots: {
      async save(snapshot) {
        savedSnapshots.push(snapshot);
      },
      async findById(id) {
        return savedSnapshots.find(
          (snapshot) => snapshot.id === id,
        ) ?? null;
      },
    },
    usage: {
      async save(event) {
        savedEvents.push(event);
      },
    },
    now: () => new Date(TIMESTAMP),
    newId: () => SNAPSHOT_ID,
    ...overrides,
  };

  return {
    useCase: new CreateCrawl(dependencies),
    entries,
    savedSnapshots,
    savedEvents,
    getSourceCalls: () => sourceCalls,
  };
}

test.describe("CreateCrawl", () => {
  test("downloads once and persists the returned snapshot", async () => {
    const context = setup();

    const result = await context.useCase.execute();

    expect(result).toEqual({
      id: SNAPSHOT_ID,
      capturedAt: TIMESTAMP,
      entries: context.entries,
    });
    expect(context.savedSnapshots).toEqual([result]);
    expect(context.getSourceCalls()).toBe(1);
  });

  test("records a successful crawl", async () => {
    const context = setup();

    await context.useCase.execute();

    expect(context.savedEvents).toEqual([
      {
        requestedAt: TIMESTAMP,
        operation: "crawl",
        filter: null,
        snapshotId: SNAPSHOT_ID,
        resultCount: 30,
        durationMs: 0,
        status: "success",
      },
    ]);
  });

  test("records a source failure and preserves the original error", async () => {
    const failure = new EntrySourceError("Source unavailable");

    const context = setup({
      source: {
        async getEntries() {
          throw failure;
        },
      },
    });

    await expect(context.useCase.execute()).rejects.toBe(failure);

    expect(context.savedSnapshots).toHaveLength(0);
    expect(context.savedEvents).toEqual([
      {
        requestedAt: TIMESTAMP,
        operation: "crawl",
        filter: null,
        snapshotId: null,
        resultCount: null,
        durationMs: 0,
        status: "error",
      },
    ]);
  });

  test("records a snapshot persistence failure", async () => {
    const failure = new Error("Database unavailable");

    const context = setup({
      snapshots: {
        async save() {
          throw failure;
        },
        async findById() {
          return null;
        },
      },
    });

    await expect(context.useCase.execute()).rejects.toBe(failure);

    expect(context.savedEvents).toHaveLength(1);
    expect(context.savedEvents[0].status).toBe("error");
    expect(context.savedEvents[0].snapshotId).toBeNull();
  });

  test("does not report success when usage recording fails", async () => {
    const failure = new Error("Unable to record usage");

    const context = setup({
      usage: {
        async save() {
          throw failure;
        },
      },
    });

    await expect(context.useCase.execute()).rejects.toBe(failure);

    expect(context.savedSnapshots).toHaveLength(1);
  });

  test("preserves both errors when crawling and usage recording fail", async () => {
    const sourceFailure = new EntrySourceError("Source unavailable");
    const loggingFailure = new Error("Unable to record usage");

    const context = setup({
      source: {
        async getEntries() {
          throw sourceFailure;
        },
      },
      usage: {
        async save() {
          throw loggingFailure;
        },
      },
    });

    await expect(context.useCase.execute()).rejects.toMatchObject({
      name: "AggregateError",
      errors: [sourceFailure, loggingFailure],
    });
  });
});