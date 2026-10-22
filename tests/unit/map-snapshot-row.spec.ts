import { expect, test } from "@playwright/test";
import { mapSnapshotRow } from "@/infrastructure/persistance/map-snapshot-row";

function createRow() {
  return {
    id: "d8bd5974-33d0-4e76-b680-77ef854c415d",
    captured_at: "2026-10-21T15:30:00.000Z",
    entries: Array.from({ length: 30 }, (_, index) => ({
      rank: index + 1,
      title: `Story ${index + 1}`,
      points: 10,
      comments: 2,
    })),
  };
}

test.describe("mapSnapshotRow", () => {
  test("converts a database row into a domain snapshot", () => {
    const row = createRow();

    const result = mapSnapshotRow(row);

    expect(result).toEqual({
      id: row.id,
      capturedAt: "2026-10-21T15:30:00.000Z",
      entries: row.entries,
    });
  });

  test("accepts a database timestamp represented as a Date", () => {
    const row = {
      ...createRow(),
      captured_at: new Date("2026-10-21T15:30:00.000Z"),
    };

    expect(mapSnapshotRow(row).capturedAt).toBe(
      "2026-10-21T15:30:00.000Z",
    );
  });

  test("rejects an incomplete snapshot", () => {
    const row = createRow();
    row.entries.pop();

    expect(() => mapSnapshotRow(row)).toThrow();
  });

  test("rejects negative points", () => {
    const row = createRow();
    row.entries[0].points = -1;

    expect(() => mapSnapshotRow(row)).toThrow();
  });

  test("rejects an invalid timestamp", () => {
    const row = createRow();
    row.captured_at = "invalid-date";

    expect(() => mapSnapshotRow(row)).toThrow();
  });
});