import type { Entry } from "../../domain/entry";
import {
  EntrySourceError,
  type EntrySource,
} from "../../application/ports/entry-source";
import { parseScrapperNews } from "./parse-scrapper-news";

const SCRAPPER_NEWS_URL = "https://news.ycombinator.com/";
const REQUEST_TIMEOUT_MS = 10_000;

export class ScrapperNewsSource implements EntrySource {
  constructor(private readonly request: typeof fetch) {}

  async getEntries(): Promise<Entry[]> {
    let html: string;

    try {
      const response = await this.request(SCRAPPER_NEWS_URL, {
        headers: {
          Accept: "text/html",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(
          `Scrapper News returned HTTP ${response.status}`,
        );
      }

      html = await response.text();
    } catch (error) {
      throw new EntrySourceError(
        "Unable to download Scrapper News",
        { cause: error },
      );
    }

    try {
      return parseScrapperNews(html);
    } catch (error) {
      throw new EntrySourceError(
        "Unable to parse Scrapper News",
        { cause: error },
      );
    }
  }
}