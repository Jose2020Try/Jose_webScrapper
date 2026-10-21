import { expect, test } from "@playwright/test";
import { countWords } from "../../src/domain/count-words";

const cases: Array<{ title: string; expected: number }> = [
  { title: "This is - a self-explained example", expected: 5 },
  { title: "Hello world", expected: 2 },
  { title: "  Hello   world  ", expected: 2 },
  { title: "Hello\tworld\nagain", expected: 3 },
  { title: "--- !!!", expected: 0 },
  { title: "Next.js 2026", expected: 2 },
  { title: "Hola 👋 mundo", expected: 2 },
  { title: "Información útil", expected: 2 },
  { title: "", expected: 0 },
  { title: "   ", expected: 0 },
];

test.describe("countWords", () => {
  for (const { title, expected } of cases) {
    test(`counts ${JSON.stringify(title)} as ${expected} words`, () => {
      expect(countWords(title)).toBe(expected);
    });
  }
});