import { expect, test } from "@playwright/test";
import type { Entry, EntryFilter } from "../../src/domain/entry";
import { filterEntries } from "../../src/domain/filter-entries";

const entries: readonly Entry[] = [
  {
    rank: 1,
    title: "Short title",
    points: 10,
    comments: 1000,
  },
  {
    rank: 2,
    title: "One two three four five six",
    points: 999,
    comments: 10,
  },
  {
    rank: 3,
    title: "One two three four five",
    points: 30,
    comments: 2,
  },
  {
    rank: 4,
    title: "One two three four five six seven",
    points: 5,
    comments: 20,
  },
  {
    rank: 5,
    title: "Another title with five words",
    points: 30,
    comments: 50,
  },
  {
    rank: 6,
    title: "A different headline with six words",
    points: 100,
    comments: 20,
  },
];

test.describe("filterEntries", () => {
  test("filters long titles and sorts by comments, then original rank", () => {
    const result = filterEntries(entries, "long-title");

    expect(result.map((entry) => entry.rank)).toEqual([4, 6, 2]);
  });

  test("includes five-word titles and sorts by points, then original rank", () => {
    const result = filterEntries(entries, "short-title");

    expect(result.map((entry) => entry.rank)).toEqual([3, 5, 1]);
  });

  test("returns all entries in their original order as a new array", () => {
    const result = filterEntries(entries, "all");

    expect(result).toEqual(entries);
    expect(result).not.toBe(entries);
  });

  const filters: EntryFilter[] = [
    "all",
    "long-title",
    "short-title",
  ];

  for (const filter of filters) {
    test(`returns an empty array for empty input with ${filter}`, () => {
      expect(filterEntries([], filter)).toEqual([]);
    });

    test(`preserves the original entries when applying ${filter}`, () => {
      const input = entries.map((entry) => ({ ...entry }));
      const original = structuredClone(input);

      filterEntries(input, filter);

      expect(input).toEqual(original);
    });
  }
});