import { expect, test } from "@playwright/test";
import type { Entry } from "../../src/domain/entry";
import {
  EntrySourceError,
  type EntrySource,
} from "../../src/application/ports/entry-source";
import { CreateCrawl } from "@/application/uses-cases/create-cawl";

test.describe("CreateCrawl", () => {
  test("retrieves entries once and returns them", async () => {
    const entries: Entry[] = Array.from(
      { length: 30 },
      (_, index) => ({
        rank: index + 1,
        title: `Story ${index + 1}`,
        points: 10,
        comments: 2,
      }),
    );

    let calls = 0;

    const source: EntrySource = {
      async getEntries() {
        calls += 1;
        return entries;
      },
    };

    const useCase = new CreateCrawl(source);

    const result = await useCase.execute();

    expect(result).toEqual({ entries });
    expect(calls).toBe(1);
  });

  test("propagates source failures instead of returning empty results", async () => {
    const failure = new EntrySourceError("Source unavailable");

    const source: EntrySource = {
      async getEntries() {
        throw failure;
      },
    };

    const useCase = new CreateCrawl(source);

    await expect(useCase.execute()).rejects.toBe(failure);
  });
});