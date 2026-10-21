import "server-only";

import { CreateCrawl } from "../application/uses-cases/create-cawl";
import { ScrapperNewsSource } from "../Infrastructure/scraping/scrapper-news-source";

const entrySource = new ScrapperNewsSource(fetch);

export const createCrawl = new CreateCrawl(entrySource); 