import "server-only";

import {
  neon,
  type NeonQueryFunction,
} from "@neondatabase/serverless";

export type Database = NeonQueryFunction<false, false>;

export function createDatabase(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(connectionString);
}