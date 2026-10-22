import { z } from "zod";

export const entrySchema = z.object({
  rank: z.number().int().positive(),
  title: z.string().trim().min(1),
  points: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
});