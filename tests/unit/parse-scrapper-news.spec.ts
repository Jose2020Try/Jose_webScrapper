import { expect, test } from "@playwright/test";
import { parseHackerNews } from "../../src/Infrastructure/scraping/parse-scrapper-news";

//helper
function createRow(
  rank: number,
  title = `Story ${rank}`,
  metadata  = '<span class="score">12 points</span><a>3 comments</a>',
): string {
  return `
     <tr class="athing">
      <td><span class="rank">${rank}.</span></td>
      <td>
        <span class="titleline">
          <a href="https://example.com">${title}</a>
        </span>
      </td>
    </tr>
    <tr>
      <td></td>
      <td class="subtext">${metadata}</td>
    </tr>
    `;
}

//helper
function createPage(firstRow = createRow(1), count = 30): string {
    const remainingRows = Array.from(
      { length: count - 1 },
      (_, index) => createRow(index + 2),
    ).join("");
  
    return `<table>${firstRow}${remainingRows}</table>`;
  }


  test.describe("parseScrapperNews",() => {
    test("extracts the four required fields and decodes HTML entities",()=>{
        const html = createPage(
            createRow(1,"Science &amp; technology",'<span class="score">123 points</span><a>45&nbsp;comments</a>')
        );

        const result = parseHackerNews(html);
        expect(result).toHaveLength(30);
        expect(result[0]).toEqual({
          rank: 1,
          title: "Science & technology",
          points: 123,
          comments: 45,
        });
        expect(result[29].rank).toBe(30);
      });

      test("only returns the first 30 entries", () => {
        const result = parseHackerNews(createPage(createRow(1), 31));
    
        expect(result).toHaveLength(30);
        expect(result.map((entry) => entry.rank)).not.toContain(31);
      });
    
      test("normalizes missing points and comments to zero", () => {
        const html = createPage(
          createRow(1, "A job posting", "<span>2 hours ago</span>"),
        );
    
        expect(parseHackerNews(html)[0]).toEqual({
          rank: 1,
          title: "A job posting",
          points: 0,
          comments: 0,
        });
      });

      test("interprets discuss as zero comments", () => {
        const html = createPage(
          createRow(
            1,
            "A new story",
            '<span class="score">1 point</span><a>discuss</a>',
          ),
        );
    
        expect(parseHackerNews(html)[0].comments).toBe(0);
        expect(parseHackerNews(html)[0].points).toBe(1);
      });
    
      test("supports a single comment", () => {
        const html = createPage(
          createRow(
            1,
            "A story",
            '<span class="score">2 points</span><a>1 comment</a>',
          ),
        );
    
        expect(parseHackerNews(html)[0].comments).toBe(1);
      });
    
      test("rejects HTML without entries", () => {
        expect(() => parseHackerNews("<html></html>")).toThrow(
          "Expected 30 entries, found 0",
        );
      });
    
      test("rejects an incomplete set of entries", () => {
        expect(() =>
          parseHackerNews(createPage(createRow(1), 29)),
        ).toThrow("Expected 30 entries, found 29");
      });
    
      test("rejects an empty title", () => {
        expect(() =>
          parseHackerNews(createPage(createRow(1, ""))),
        ).toThrow("Missing title");
      });
    
      test("rejects malformed points instead of silently returning zero", () => {
        const html = createPage(
          createRow(
            1,
            "A story",
            '<span class="score">abc points</span><a>3 comments</a>',
          ),
        );
    
        expect(() => parseHackerNews(html)).toThrow("Invalid points");
      });
    
      test("rejects malformed comments", () => {
        const html = createPage(
          createRow(
            1,
            "A story",
            '<span class="score">12 points</span><a>many comments</a>',
          ),
        );
    
        expect(() => parseHackerNews(html)).toThrow("Invalid comments");
      });
  });