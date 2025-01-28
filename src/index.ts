import { eq, sql, and } from "drizzle-orm";
import { db } from "./db/client.js";
import * as schema from "./db/schema.js";
import { createEmbedding } from "./utils/create-embedding.js";
import pLimit from "p-limit";
import { createJobSummary } from "./processors/create-job-summary/create-job-summary.js";
import { getTags } from "./utils/get-tags.js";

const JOBS_LIMIT = 1000;
async function main() {
  try {
    const limit = pLimit(50); // Maximum number of concurrent requests
    const jobs = await db.query.jobs.findMany({
      limit: JOBS_LIMIT,
    });
    let tagsAddedCount = 0;

    if (jobs.length === 0) return;

    const batchSize = 100;

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const tasks = batch.map((job) => {
        return limit(async () => {
          try {
            const { title, description, id } = job;
            const PROMPT_ID = 2;
            const savedSummary = await db
              .select()
              .from(schema.jobSummaries)
              .where(and(eq(schema.jobSummaries.job_id, id), eq(schema.jobSummaries.prompt_id, PROMPT_ID)))
              .execute()
              .then((res) => res[0]);

            // No need to create new vectors or summaries if we already have one saved
            if (savedSummary) {
              const tags = await getTags(savedSummary.vector ?? []);

              if (tags.length > 0) {
                tagsAddedCount += 1;
                await db
                  .insert(schema.tagsToJobs)
                  .values(
                    tags.map((tag): schema.NewTagsToJobs => {
                      return {
                        job_id: job.id,
                        tag_id: tag.id,
                      };
                    }),
                  )
                  .onConflictDoNothing();
              }

              return;
            }

            const summary = await createJobSummary(PROMPT_ID, { title, description: description ?? "" });
            const embedding = await createEmbedding(summary);

            const tags = await getTags(embedding);

            await db.transaction(async (tx) => {
              await tx
                .insert(schema.jobSummaries)
                .values({
                  job_id: id,
                  prompt_id: PROMPT_ID,
                  summary: summary ?? "",
                  vector: embedding,
                })
                .onConflictDoUpdate({
                  target: [schema.jobSummaries.job_id, schema.jobSummaries.prompt_id],
                  set: {
                    summary: sql`excluded.summary`,
                    vector: sql`excluded.vector`,
                    updated_at: sql`(CURRENT_TIMESTAMP)`,
                  },
                });

              if (tags.length > 0) {
                tagsAddedCount += 1;
                await tx
                  .insert(schema.tagsToJobs)
                  .values(
                    tags.map((tag): schema.NewTagsToJobs => {
                      return {
                        job_id: job.id,
                        tag_id: tag.id,
                      };
                    }),
                  )
                  .onConflictDoNothing();
              }
            });
          } catch (error) {
            console.error(`Failed to process job with ID ${job.id}:`, error);
          }
        });
      });

      await Promise.all(tasks)
        .catch((error) => {
          console.error("Batch processing failed:", error);
        })
        .finally(() => {
          console.log(`Processed ${i + batch.length} of ${jobs.length} jobs`);
        });
    }

    console.log(`Tags were added to: ${tagsAddedCount} jobs.`);
  } catch (error) {
    console.error("Failed to execute main function:", error);
    process.exit(1);
  }
}

main();
