import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";
import { cosineSimilarity } from "../utils/cosine-similarity.js";

const SOFTWARE_ENG_TAG = 19;
async function main() {
  // Get sample job
  // * Must have a tag of "Software Engineering" (id: 19)
  const jobs = await db
    .select({
      id: schema.jobs.id,
      title: schema.jobs.title,
      description: schema.jobs.description,
      summary: schema.jobSummaries.summary,
      summary_vector: schema.jobSummaries.vector,
    })
    .from(schema.jobs)
    .innerJoin(schema.jobSummaries, eq(schema.jobSummaries.job_id, schema.jobs.id))
    .innerJoin(schema.tagsToJobs, eq(schema.jobs.id, schema.tagsToJobs.job_id))
    .where(eq(schema.tagsToJobs.tag_id, SOFTWARE_ENG_TAG))
    // .orderBy(sql`RANDOM()`)
    .limit(1000);

  const segments = await db
    .select({
      id: schema.segments.id,
      name: schema.segments.name,
      description: schema.segments.description,
      vector: schema.segments.vector,
    })
    .from(schema.segments)
    .where(eq(schema.segments.tag_id, SOFTWARE_ENG_TAG));

  const jobsWithSegments = jobs
    .map((job) => {
      const matchedSegments = segments
        .map((segment) => {
          const score = cosineSimilarity(job.summary_vector!, segment.vector!);
          return {
            segment,
            score,
          };
        })
        .filter(({ score }) => {
          return score > 0.55;
        });
      return {
        job,
        segments: matchedSegments,
      };
    })
    .filter(({ segments }) => segments.length > 0);
}
main();
