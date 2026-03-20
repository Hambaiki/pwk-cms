import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL!;

// `prepare: false` is only required for Supabase's transaction pooler (port 6543).
// Direct connections (port 5432) support prepared statements natively.
const isPooler = url.includes(":6543");

const client = postgres(url, {
  prepare: !isPooler,
  ssl: url.includes("localhost") ? false : "require",
});

export const db = drizzle({ client, schema });
