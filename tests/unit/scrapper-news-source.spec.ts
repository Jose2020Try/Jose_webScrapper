import { expect, test } from "@playwright/test";
import { EntrySourceError } from "../../src/application/ports/entry-source";
import { ScrapperNewsSource } from "@/Infrastructure/scraping/scrapper-news-source";
import { createPage } from "../fixtures/scrapper-news";

test.describe("ScrapperNewsSource", () => {
  test("downloads the front page and returns parsed entries", async () => {
    const requests: Array<{
      input: Parameters<typeof fetch>[0];
      init: Parameters<typeof fetch>[1];
    }> = [];

    const fakeFetch: typeof fetch = async (input, init) => {
      requests.push({ input, init });

      return new Response(createPage(), {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      });
    };

    const source = new ScrapperNewsSource(fakeFetch);
    const entries = await source.getEntries();

    expect(entries).toHaveLength(30);
    expect(entries[0]).toEqual({
      rank: 1,
      title: "Story 1",
      points: 12,
      comments: 3,
    });

    expect(requests).toHaveLength(1);
    expect(requests[0].input).toBe(
      "https://news.ycombinator.com/",
    );
    expect(requests[0].init?.cache).toBe("no-store");
    expect(requests[0].init?.signal).toBeInstanceOf(AbortSignal);

    const headers = new Headers(requests[0].init?.headers);
    expect(headers.get("Accept")).toBe("text/html");
  });

  for (const status of [403, 429, 500]) {
    test(`rejects an HTTP ${status} response`, async () => {
      const fakeFetch: typeof fetch = async () =>
        new Response("Request failed", { status });

      const source = new ScrapperNewsSource(fakeFetch);

      await expect(source.getEntries()).rejects.toThrow(
        "Unable to download Scrapper News",
      );
    });
  }

  test("preserves the original network error", async () => {
    const networkError = new TypeError("Network unavailable");

    const fakeFetch: typeof fetch = async () => {
      throw networkError;
    };

    const source = new ScrapperNewsSource(fakeFetch);

    await expect(source.getEntries()).rejects.toMatchObject({
      name: "EntrySourceError",
      message: "Unable to download Scrapper News",
      cause: networkError,
    });
  });

  test("reports a timeout as a download failure", async () => {
    const timeoutError = new DOMException(
      "The operation timed out",
      "TimeoutError",
    );

    const fakeFetch: typeof fetch = async () => {
      throw timeoutError;
    };

    const source = new ScrapperNewsSource(fakeFetch);

    await expect(source.getEntries()).rejects.toMatchObject({
      name: "EntrySourceError",
      message: "Unable to download Scrapper News",
      cause: timeoutError,
    });
  });

  test("rejects a successful HTTP response containing invalid HTML", async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response("<html>Unexpected page</html>", {
        status: 200,
      });

    const source = new ScrapperNewsSource(fakeFetch);

    await expect(source.getEntries()).rejects.toThrow(
      "Unable to parse Scrapper News",
    );
  });

  test("exposes a recognizable application error", async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response("", { status: 503 });

    const source = new ScrapperNewsSource(fakeFetch);

    await expect(source.getEntries()).rejects.toBeInstanceOf(
      EntrySourceError,
    );
  });
});