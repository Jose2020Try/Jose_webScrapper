import { expect, test, type Page } from "@playwright/test";
import { mockApi, snapshot, SNAPSHOT_IDS } from "../fixtures/browser-api";

async function openAndLoad(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Load entries" }).click();

  await expect(page.getByRole("status")).toContainText("30 entries");

  await expect(page.locator("tbody tr")).toHaveCount(30);
}

test.describe("Crawler interface", () => {
  test("starts empty and loads 30 entries on request", async ({ page }) => {
    const api = await mockApi(page);

    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "All entries", exact: true }),
    ).toBeDisabled();

    await expect(
      page.getByRole("button", { name: "More than 5 words" }),
    ).toBeDisabled();

    await expect(
      page.getByRole("button", { name: "5 words or fewer" }),
    ).toBeDisabled();

    await expect(page.getByRole("table")).toHaveCount(0);
    expect(api.getCrawlCount()).toBe(0);

    await page.getByRole("button", { name: "Load entries" }).click();

    await expect(page.locator("tbody tr")).toHaveCount(30);

    await expect(
      page.getByRole("cell", { name: "Café & tecnología", exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Refresh entries" }),
    ).toBeEnabled();

    expect(api.getCrawlCount()).toBe(1);
  });

  test("switches filters using the same snapshot without crawling again", async ({
    page,
  }) => {
    const api = await mockApi(page);
    await openAndLoad(page);

    const ranks = page.locator("tbody tr td:first-child");

    await page.getByRole("button", { name: "More than 5 words" }).click();

    await expect(ranks).toHaveText(["4", "5", "3"]);

    await expect(
      page.getByRole("button", { name: "More than 5 words" }),
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "5 words or fewer" }).click();

    await expect(ranks).toHaveText([
      "2",
      "1",
      ...Array.from({ length: 25 }, (_, index) => String(index + 6)),
    ]);

    await page
      .getByRole("button", { name: "All entries", exact: true })
      .click();

    await expect(ranks).toHaveText(
      Array.from({ length: 30 }, (_, index) => String(index + 1)),
    );

    expect(api.getCrawlCount()).toBe(1);

    expect(api.filterRequests).toEqual([
      { snapshotId: SNAPSHOT_IDS[0], filter: "long-title" },
      { snapshotId: SNAPSHOT_IDS[0], filter: "short-title" },
      { snapshotId: SNAPSHOT_IDS[0], filter: "all" },
    ]);
  });

  test("uses the new snapshot after refreshing", async ({ page }) => {
    const api = await mockApi(page);
    await openAndLoad(page);

    await page.getByRole("button", { name: "Refresh entries" }).click();

    await expect(
      page.getByRole("button", { name: "More than 5 words" }),
    ).toBeEnabled();

    await page.getByRole("button", { name: "More than 5 words" }).click();

    await expect(page.locator("tbody tr")).toHaveCount(3);

    expect(api.getCrawlCount()).toBe(2);
    expect(api.filterRequests).toEqual([
      { snapshotId: SNAPSHOT_IDS[1], filter: "long-title" },
    ]);
  });

  test("shows a download error and allows retrying", async ({ page }) => {
    await mockApi(page);

    await page.route(
      "**/api/crawls",
      async (route) => {
        await route.fulfill({
          status: 502,
          json: {
            error: { message: "Source temporarily unavailable." },
          },
        });
      },
      { times: 1 },
    );

    await page.goto("/");
    await page.getByRole("button", { name: "Load entries" }).click();

    await expect(
      page.getByRole("region", { name: "News explorer" }).getByRole("alert"),
    ).toHaveText("Source temporarily unavailable.");

    await expect(
      page.getByRole("button", { name: "Load entries" }),
    ).toBeEnabled();

    await page.getByRole("button", { name: "Load entries" }).click();

    await expect(page.locator("tbody tr")).toHaveCount(30);
    await expect(
      page.getByRole("region", { name: "News explorer" }).getByRole("alert"),
    ).toHaveCount(0);
  });

  test("preserves previous results when a filter request fails", async ({
    page,
  }) => {
    await mockApi(page);
    await openAndLoad(page);

    await page.route(
      "**/api/crawls/*/entries?*",
      async (route) => {
        await route.fulfill({
          status: 500,
          json: {
            error: { message: "Unable to retrieve entries." },
          },
        });
      },
      { times: 1 },
    );

    await page.getByRole("button", { name: "More than 5 words" }).click();

    await expect(
      page.getByRole("region", { name: "News explorer" }).getByRole("alert"),
    ).toHaveText("Unable to retrieve entries.");

    await expect(page.locator("tbody tr")).toHaveCount(30);

    await expect(
      page.getByRole("button", { name: "All entries", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "More than 5 words" }).click();

    await expect(page.locator("tbody tr")).toHaveCount(3);
    await expect(
      page.getByRole("region", { name: "News explorer" }).getByRole("alert"),
    ).toHaveCount(0);
  });

  test("shows an empty state and allows selecting another filter", async ({
    page,
  }) => {
    await mockApi(page);
    await openAndLoad(page);

    await page.route(
      "**/api/crawls/*/entries?*",
      async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            snapshotId: snapshot.id,
            capturedAt: snapshot.capturedAt,
            filter: "long-title",
            entries: [],
          },
        });
      },
      { times: 1 },
    );

    await page.getByRole("button", { name: "More than 5 words" }).click();

    await expect(
      page.getByText("No entries match this filter. Try another filter."),
    ).toBeVisible();

    await expect(page.getByRole("table")).toHaveCount(0);

    await page
      .getByRole("button", { name: "All entries", exact: true })
      .click();

    await expect(page.locator("tbody tr")).toHaveCount(30);
  });

  test("disables controls while a request is pending", async ({ page }) => {
    await mockApi(page);

    let releaseResponse!: () => void;

    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });

    await page.route("**/api/crawls", async (route) => {
      await responseGate;

      await route.fulfill({
        status: 201,
        json: snapshot,
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Load entries" }).click();

    try {
      await expect(
        page.getByRole("button", { name: "Working..." }),
      ).toBeDisabled();

      await expect(
        page.getByRole("button", { name: "More than 5 words" }),
      ).toBeDisabled();

      await expect(page.getByRole("status")).toHaveText("Loading results...");
    } finally {
      releaseResponse();
    }

    await expect(page.locator("tbody tr")).toHaveCount(30);

    await expect(
      page.getByRole("button", { name: "Refresh entries" }),
    ).toBeEnabled();
  });
});
