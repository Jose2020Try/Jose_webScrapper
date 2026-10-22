import "server-only";

import { randomUUID } from "node:crypto";
import { CreateCrawl } from "../application/use-cases/create-crawl";
import { ScrapperNewsSource } from "../infrastructure/scraping/scrapper-news-source";
import { createDatabase } from "@/infrastructure/persistance/database";
import { PostgresSnapshotRepository } from "@/infrastructure/persistance/postgres-snapshot-repository";
import { PostgresUsageRepository } from "@/infrastructure/persistance/postgres-usage-repository";
import { GetFilteredEntries } from "@/application/use-cases/get-filtered-entries";

const entrySource = new ScrapperNewsSource(fetch);
const database = createDatabase();

const snapshots = new PostgresSnapshotRepository(database);
const usage = new PostgresUsageRepository(database);

export const createCrawl = new CreateCrawl({
  source: entrySource,
  snapshots,
  usage,
  now: () => new Date(),
  newId: randomUUID,
});

export const getFilteredEntries = new GetFilteredEntries({
    snapshots,
    usage,
    now: () => new Date(),
  });