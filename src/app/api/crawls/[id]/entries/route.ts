import { z } from "zod";
import { getFilteredEntries } from "@/composition/dependencies";
import { SnapshotNotFoundError } from "@/application/use-cases/get-filtered-entries";

const inputSchema = z.object({
  id: z.string().uuid(),
  filter: z.enum(["all", "long-title", "short-title"]),
});

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const url = new URL(request.url);

  const input = inputSchema.safeParse({
    id,
    filter: url.searchParams.get("filter") ?? "all",
  });

  if (!input.success) {
    return json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Provide a valid snapshot ID and filter.",
        },
      },
      400,
    );
  }

  try {
    const result = await getFilteredEntries.execute(
      input.data.id,
      input.data.filter,
    );

    return json(result);
  } catch (error) {
    if (error instanceof SnapshotNotFoundError) {
      return json(
        {
          error: {
            code: "SNAPSHOT_NOT_FOUND",
            message: "The requested snapshot does not exist.",
          },
        },
        404,
      );
    }

    console.error("Failed to retrieve filtered entries:", error);

    return json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve entries.",
        },
      },
      500,
    );
  }
}