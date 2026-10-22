import type { Page } from "@playwright/test";

export const SNAPSHOT_IDS = [
  "d8bd5974-33d0-4e76-b680-77ef854c415d",
  "a5a8cf5e-3de1-4ab8-938c-458884c84293",
];

const entries = Array.from({ length: 30 }, (_, index) => ({
  rank: index + 1,
  title: "Brief update",
  points: 0,
  comments: 0,
}));

entries[0] = {
  rank: 1,
  title: "Café & tecnología",
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

export const snapshot = {
  id: SNAPSHOT_IDS[0],
  capturedAt: "2026-10-22T15:30:00.000Z",
  entries,
};

export async function mockApi(page: Page) {
  let crawlCount = 0;
  const filterRequests: Array<{
    snapshotId: string;
    filter: string;
  }> = [];

  await page.route("**/api/crawls", async (route) => {
    crawlCount += 1;

    const id =
      crawlCount === 1 ? SNAPSHOT_IDS[0] : SNAPSHOT_IDS[1];

    await route.fulfill({
      status: 201,
      json: { ...snapshot, id },
    });
  });

  await page.route("**/api/crawls/*/entries?*", async (route) => {
    const url = new URL(route.request().url());
    const snapshotId = url.pathname.split("/")[3];
    const filter = url.searchParams.get("filter") ?? "all";

    filterRequests.push({ snapshotId, filter });

    let selectedEntries = entries;

    if (filter === "long-title") {
      selectedEntries = [entries[3], entries[4], entries[2]];
    } else if (filter === "short-title") {
      selectedEntries = [
        entries[1],
        entries[0],
        ...entries.slice(5),
      ];
    } else if (filter !== "all") {
      await route.fulfill({
        status: 400,
        json: {
          error: { message: "Invalid filter." },
        },
      });
      return;
    }

    await route.fulfill({
      status: 200,
      json: {
        snapshotId,
        capturedAt: snapshot.capturedAt,
        filter,
        entries: selectedEntries,
      },
    });
  });

  return {
    filterRequests,
    getCrawlCount: () => crawlCount,
  };
}