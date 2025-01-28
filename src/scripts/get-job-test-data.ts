import fs from "fs";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

async function getJobTestData() {
  const jobs = await db
    .select()
    .from(schema.jobs)
    .orderBy(sql`RANDOM()`)
    .limit(15);
  const path = `${process.cwd()}/src/data/job-test-data.json`;

  fs.writeFileSync(
    path,
    JSON.stringify(
      jobs.map((j) => {
        return {
          title: j.title,
          description: j.description,
        };
      }),
      null,
      2,
    ),
    "utf-8",
  );
}
getJobTestData();
