import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

export const db = drizzle({
  schema,
  connection: {
    url: process.env["DATABASE_URL"]!,
  },
});
