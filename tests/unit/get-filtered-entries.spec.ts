import { expect, test } from "@playwright/test";
import type { EntryFilter } from "../../src/domain/entry";
import type { CrawlSnapshot } from "../../src/domain/crawl-snapshot";
import type { UsageEvent } from "../../src/application/ports/usage-repository";
import {
  GetFilteredEntries,
  SnapshotNotFoundError,
  type GetFilteredEntriesDependencies,
} from "../../src/application/use-cases/get-filtered-entries";

const SNAPSHOT_ID = "d8bd5974-33d0-4e76-b680-77ef854c415d";
const TIMESTAMP = "2026-10-22T15:30:00.000Z";

function setup(
  overrides: Partial<GetFilteredEntriesDependencies> = {},
) {
  const entries = Array.from({ length: 30 }, (_, index) => ({
    rank: index + 1,
    title: "Short title",
    points: 0,
    comments: 0,
  }));

  entries[0] = {
    rank: 1,
    title: "Short title",
    points: 20,
    comments: 1000,
  };

  entries[1] = {
    rank: 2,
    title: "One two three four five",
    points: 40,
    comments: 0,
  };

  entries[2] = {
    rank: 3,
    title: "One two three four five six",
    points: 999,
    comments: 10,
  };

  entries[3] = {
    rank: 4,
    title: "One two three four five six seven",
    points: 0,
    comments: 20,
  };

  entries[4] = {
    rank: 5,
    title: "A different headline with six words",
    points: 0,
    comments: 20,
  };

  const snapshot: CrawlSnapshot = {
    id: SNAPSHOT_ID,
    capturedAt: TIMESTAMP,
    entries,
  };

  const events: UsageEvent[] = [];
  const requestedIds: string[] = [];

  const dependencies: GetFilteredEntriesDependencies = {
    snapshots: {
      async save() {
        throw new Error("Filtering must not save snapshots");
      },
      async findById(id) {
        requestedIds.push(id);
        return id === SNAPSHOT_ID ? snapshot : null;
      },
    },
    usage: {
      async save(event) {
        events.push(event);
      },
    },
    now: () => new Date(TIMESTAMP),
    ...overrides,
  };

  return {
    useCase: new GetFilteredEntries(dependencies),
    snapshot,
    events,
    requestedIds,
  };
}

test.describe("GetFilteredEntries", () => {
  const cases: Array<{
    filter: EntryFilter;
    expectedRanks: number[];
  }> = [
    {
      filter: "all",
      expectedRanks: Array.from(
        { length: 30 },
        (_, index) => index + 1,
      ),
    },
    {
      filter: "long-title",
      expectedRanks: [4, 5, 3],
    },
    {
      filter: "short-title",
      expectedRanks: [
        2,
        1,
        ...Array.from({ length: 25 }, (_, index) => index + 6),
      ],
    },
  ];

  for (const { filter, expectedRanks } of cases) {
    test(`returns and records the ${filter} filter`, async () => {
      const context = setup();
      const original = structuredClone(context.snapshot);

      const result = await context.useCase.execute(
        SNAPSHOT_ID,
        filter,
      );

      expect(result.snapshotId).toBe(SNAPSHOT_ID);
      expect(result.capturedAt).toBe(TIMESTAMP);
      expect(result.filter).toBe(filter);
      expect(result.entries.map((entry) => entry.rank)).toEqual(
        expectedRanks,
      );

      expect(context.requestedIds).toEqual([SNAPSHOT_ID]);
      expect(context.snapshot).toEqual(original);

      expect(context.events).toEqual([
        {
          requestedAt: TIMESTAMP,
          operation: "filter",
          filter,
          snapshotId: SNAPSHOT_ID,
          resultCount: expectedRanks.length,
          durationMs: 0,
          status: "success",
        },
      ]);
    });
  }

  test("records a missing snapshot without referencing a nonexistent row", async () => {
    const context = setup();

    await expect(
      context.useCase.execute(
        "11111111-1111-4111-8111-111111111111",
        "long-title",
      ),
    ).rejects.toBeInstanceOf(SnapshotNotFoundError);

    expect(context.events).toHaveLength(1);
    expect(context.events[0]).toMatchObject({
      operation: "filter",
      filter: "long-title",
      snapshotId: null,
      resultCount: null,
      status: "error",
    });
  });

  test("records a repository failure", async () => {
    const failure = new Error("Database unavailable");

    const context = setup({
      snapshots: {
        async save() {},
        async findById() {
          throw failure;
        },
      },
    });

    await expect(
      context.useCase.execute(SNAPSHOT_ID, "all"),
    ).rejects.toBe(failure);

    expect(context.events).toHaveLength(1);
    expect(context.events[0].status).toBe("error");
  });

  test("fails when usage cannot be recorded", async () => {
    const failure = new Error("Unable to record usage");

    const context = setup({
      usage: {
        async save() {
          throw failure;
        },
      },
    });

    await expect(
      context.useCase.execute(SNAPSHOT_ID, "short-title"),
    ).rejects.toBe(failure);
  });
});