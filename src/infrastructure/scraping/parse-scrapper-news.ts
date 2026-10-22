import { load } from "cheerio";
import type { Entry } from "../../domain/entry";

const ENTRY_LIMIT = 30;

function parseInteger(value: string, field: string): number {
  const number = Number(value);

  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number)) {
    throw new Error(`Invalid ${field}: "${value}"`);
  }

  return number;
}

export function parseScrapperNews(html: string) {
  const $ = load(html);
  const rows = $("tr.athing").slice(0, ENTRY_LIMIT);

  if (rows.length !== ENTRY_LIMIT) {
    throw new Error(
      `Expected ${ENTRY_LIMIT} entries, found ${rows.length}`,
    );
  }

  return rows.toArray().map((row): Entry => {
    const $row = $(row);

    const rankText = $row.find(".rank").text().trim();
    const title = $row.find(".titleline > a").first().text().trim();
    const metadata = $row.next("tr").find(".subtext");

    if (!/^\d+\.$/.test(rankText)) {
      throw new Error(`Invalid entry rank: "${rankText}"`);
    }

    if (!title) {
      throw new Error(`Missing title for entry ${rankText}`);
    }

    if (metadata.length !== 1) {
      throw new Error(`Missing metadata for entry ${rankText}`);
    }

    // rank
    const rank = parseInteger(rankText.slice(0, -1), "rank");

    if (rank < 1) {
      throw new Error("Entry rank must be positive");
    }

    // points or score
    const score = metadata.find(".score");
    let points = 0;

    if (score.length > 0) {
      const scoreText = score.text().trim();
      const match = scoreText.match(/^(\d+)\s+points?$/);

      if (!match) {
        throw new Error(`Invalid points: "${scoreText}"`);
      }

      points = parseInteger(match[1], "points");
    }

    // comments
    const commentText = metadata
      .find("a")
      .toArray()
      .map((link) => $(link).text().replace(/\s+/g, " ").trim())
      .find(
        (text) => text === "discuss" || /comments?$/.test(text),
      );

    let comments = 0;

    if (commentText && commentText !== "discuss") {
      const match = commentText.match(/^(\d+)\s+comments?$/);

      if (!match) {
        throw new Error(`Invalid comments: "${commentText}"`);
      }

      comments = parseInteger(match[1], "comments");
    }

    return { rank, title, points, comments };
  });
}