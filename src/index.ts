import { eq, sql, isNotNull, and } from "drizzle-orm";
import { db } from "./db/client.js";
import * as schema from "./db/schema.js";
import { openai } from "./lib/openai.js";
import { removeStopwords } from "./utils/stopwords.js";
import { createEmbedding } from "./utils/create-embedding.js";
import { cosineSimilarity } from "./utils/cosine-similarity.js";

async function main() {
  try {
    const jobs = await db.query.jobs.findMany({
      limit: 100,
      offset: 100,
    });
    let tagsAddedCount = 0;

    if (jobs.length === 0) return;

    const tasks = jobs.map(async (job) => {
      try {
        const { title, description, id } = job ?? {};
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

        const prompt = await getPrompt(PROMPT_ID, { title, description: description ?? "" });
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-1106",
          messages: [
            { role: "system", content: "You are a professional text summarizer for a job classification pipeline." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
        });

        const summary = response.choices[0].message.content;
        const refinedSummary = removeStopwords(summary?.split(" ") ?? []).join(" ");
        const jobSummaryEmbedding = await createEmbedding(refinedSummary ?? "");

        const tags = await getTags(jobSummaryEmbedding);

        await db.transaction(async (tx) => {
          await tx
            .insert(schema.jobSummaries)
            .values({
              job_id: id,
              prompt_id: PROMPT_ID,
              summary: summary ?? "",
              vector: jobSummaryEmbedding,
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

    await Promise.all(tasks);
    console.log(`Tags were added to: ${tagsAddedCount} jobs.`);
  } catch (error) {
    console.error("Failed to execute main function:", error);
    process.exit(1);
  }
}

async function getPrompt(id: number, { title, description }: { title: string; description: string }) {
  try {
    const prompt = await db.query.jobSummaryPrompts.findFirst({
      where: eq(schema.jobSummaryPrompts.id, id),
    });

    return (
      prompt?.content.replace(/\{(\w+)\}/g, (_, key) => {
        const replacements = { title, description };

        return replacements[key as keyof typeof replacements] ?? "";
      }) ?? ""
    );
  } catch (error) {
    console.error(`Failed to retrieve prompt with ID ${id}:`, error);
    throw error;
  }
}
main();

async function getTags(inputVector: Array<number>) {
  const jobFunctionEmbeddings = await db.select().from(schema.tags).where(isNotNull(schema.tags.vector));
  const scored = jobFunctionEmbeddings.map(({ vector, ...rest }) => {
    const score = cosineSimilarity(inputVector, vector!);

    return {
      ...rest,
      vector,
      score,
    };
  });

  const tags = scored.filter(({ score }) => {
    return score > 0.45;
  });

  return tags;
}
