"use client";

import { useState } from "react";
import { z } from "zod";
import type { EntryFilter } from "@/domain/entry";
import { entrySchema } from "@/contracts/entry-schema";
import styles from "./crawler.module.css";

const snapshotSchema = z.object({
  id: z.uuid(),
  capturedAt: z.iso.datetime(),
  entries: z.array(entrySchema).length(30),
});

const filteredResultSchema = z.object({
  snapshotId: z.uuid(),
  capturedAt: z.iso.datetime(),
  filter: z.enum(["all", "long-title", "short-title"]),
  entries: z.array(entrySchema).max(30),
});

const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});

type Results = z.infer<typeof filteredResultSchema>;

const filters: Array<{
  value: EntryFilter;
  label: string;
}> = [
  { value: "all", label: "All entries" },
  { value: "long-title", label: "More than 5 words" },
  { value: "short-title", label: "5 words or fewer" },
];

const descriptions: Record<EntryFilter, string> = {
  "all": "Original Hacker News ranking.",
  "long-title":
    "Titles with more than 5 words, sorted by comments descending.",
  "short-title":
    "Titles with 5 words or fewer, sorted by points descending.",
};

async function requestJson(
  url: string,
  options?: RequestInit,
): Promise<unknown> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(body);

    throw new Error(
      parsedError.success
        ? parsedError.data.error.message
        : `Request failed with status ${response.status}.`,
    );
  }

  return body;
}

export default function Crawler() {
  const [results, setResults] = useState<Results | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEntries() {
    setBusy(true);
    setError(null);

    try {
      const body = await requestJson("/api/crawls", {
        method: "POST",
      });

      const snapshot = snapshotSchema.parse(body);

      setResults({
        snapshotId: snapshot.id,
        capturedAt: snapshot.capturedAt,
        filter: "all",
        entries: snapshot.entries,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load entries.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function applyFilter(filter: EntryFilter) {
    if (!results) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const body = await requestJson(
        `/api/crawls/${results.snapshotId}/entries?filter=${filter}`,
      );

      setResults(filteredResultSchema.parse(body));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to apply the filter.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>SCRAPPER NEWS</p>
            <h1 className={styles.title}>The front page, filtered.</h1>
            <p className={styles.subtitle}>
              Capture the first 30 Hacker News entries and explore
              them by title length, points, and comments.
            </p>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={loadEntries}
            disabled={busy}
          >
            {busy
              ? "Working..."
              : results
                ? "Refresh entries"
                : "Load entries"}
          </button>
        </header>

        <section className={styles.panel} aria-label="News explorer">
          <div
            className={styles.filters}
            role="group"
            aria-label="Filter entries"
          >
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={styles.filterButton}
                aria-pressed={results?.filter === filter.value}
                disabled={busy || !results}
                onClick={() => applyFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <p className={styles.status} role="status">
            {busy
              ? "Loading results..."
              : results
                ? `${results.entries.length} entries. ${
                    descriptions[results.filter]
                  }`
                : "Load entries to create your first snapshot."}
          </p>

          {results && (
            <>
              <p className={styles.timestamp}>
                Captured{" "}
                <time dateTime={results.capturedAt}>
                  {new Date(results.capturedAt).toLocaleString()}
                </time>
                . Filters use this same snapshot.
              </p>

              {results.entries.length === 0 ? (
                <p className={styles.empty}>
                  No entries match this filter. Try another filter.
                </p>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <caption className={styles.srOnly}>
                      Hacker News entries for the selected filter
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Rank</th>
                        <th scope="col">Title</th>
                        <th scope="col">Points</th>
                        <th scope="col">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.entries.map((entry) => (
                        <tr key={entry.rank}>
                          <td className={styles.number}>
                            {entry.rank}
                          </td>
                          <td>{entry.title}</td>
                          <td className={styles.number}>
                            {entry.points}
                          </td>
                          <td className={styles.number}>
                            {entry.comments}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        <footer className={styles.footer}>
          Source:{" "}
          <a
            href="https://news.ycombinator.com/"
            target="_blank"
            rel="noreferrer"
          >
            Hacker News
          </a>
          . Original ranks are preserved when filtering.
        </footer>
      </div>
    </main>
  );
}