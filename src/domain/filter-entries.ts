import { countWords } from "./count-words";
import type { Entry, EntryFilter } from "./entry";

export function filterEntries(
  entries: readonly Entry[],
  filter: EntryFilter,
): Entry[] {
  switch (filter) {
    case "all":
      return [...entries];

    case "long-title":
      return entries
        .filter((entry) => countWords(entry.title) > 5)
        .sort((a, b) => b.comments - a.comments || a.rank - b.rank);
    // sorting by descending if not then orginal position is being used.

    case "short-title":
      return entries
        .filter((entry) => countWords(entry.title) <= 5)
        .sort((a, b) => b.points - a.points || a.rank - b.rank);
    // sorting by descending if not then orginal position is being used.
  }
}
