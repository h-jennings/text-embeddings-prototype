import { db } from "./client.js";
import * as schema from "./schema.js";
import { reset } from "drizzle-seed";

async function main() {
  await reset(db, schema);
}
main();
