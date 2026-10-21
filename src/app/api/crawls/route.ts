import { EntrySourceError } from "@/application/ports/entry-source";
import { createCrawl } from "@/composition/dependencies";

export async function POST(): Promise<Response> {
  try {
    const result = await createCrawl.execute();

    return Response.json(result, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });
  } catch (error) {
    console.error("Failed to execute crawl:", error);

    if (error instanceof EntrySourceError) {
      return Response.json(
        {
          error: {
            code: "SOURCE_UNAVAILABLE",
            message: "Unable to retrieve entries from Hacker News.",
          },
        },
        { status: 502 },
      );
    }

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 },
    );
  }
}