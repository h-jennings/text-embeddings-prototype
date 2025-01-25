import { eq, sql, isNotNull } from "drizzle-orm";
import { db } from "./db/client.js";
import * as schema from "./db/schema.js";
import { openai } from "./lib/openai.js";
import { removeStopwords } from "./utils/stopwords.js";
import { createEmbedding } from "./utils/create-embedding.js";
import { cosineSimilarity } from "./utils/cosine-similarity.js";

async function main() {
  const jobFunctionEmbeddings = await db.select().from(schema.tags).where(isNotNull(schema.tags.vector));
  const jobs = await db.query.jobs.findMany({
    limit: 100,
    offset: 100,
  });
  let tagsAddedCount = 0;

  if (jobs.length === 0) return;

  const tasks = jobs.map(async (job) => {
    const { title, description, id } = job ?? {};
    const PROMPT_ID = 2;
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

    const scored = jobFunctionEmbeddings.map(({ vector, ...rest }) => {
      const score = cosineSimilarity(jobSummaryEmbedding, vector!);

      return {
        ...rest,
        vector,
        score,
      };
    });

    const tags = scored.filter(({ score }) => {
      return score > 0.45;
    });

    try {
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
              summary: summary ?? "",
              vector: jobSummaryEmbedding,
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
      console.error("Summary failed", error);
      process.exit(1);
    }
  });

  await Promise.all(tasks);
  console.log(`Tags were added to: ${tagsAddedCount} jobs.`);
}

async function getPrompt(id: number, { title, description }: { title: string; description: string }) {
  const prompt = await db.query.jobSummaryPrompts.findFirst({
    where: eq(schema.jobSummaryPrompts.id, id),
  });

  return (
    prompt?.content.replace(/\{(\w+)\}/g, (_, key) => {
      const replacements = { title, description };

      return replacements[key as keyof typeof replacements] ?? "";
    }) ?? ""
  );
}
main();
