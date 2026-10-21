import type { Entry } from "../../domain/entry";
import type { EntrySource } from "../ports/entry-source";

export interface CrawlResult {
  entries: Entry[];
}

export class CreateCrawl {
  constructor(private readonly source: EntrySource) {}

  async execute(): Promise<CrawlResult> {
    const entries = await this.source.getEntries();

    return { entries };
  }
}