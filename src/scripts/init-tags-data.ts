import * as schema from "../db/schema.js";
import job_functions from "../data/job-functions.json" assert { type: "json" };
import { db } from "../db/client.js";
import { createEmbedding } from "../utils/create-embedding.js";
import { sql } from "drizzle-orm";

export async function createJobFunctionTagData() {
  console.log("Starting to create job function tag data...");
  const jobFunctionData = await fetchJobFunctionEmbeddings();
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.tags)
        .values(jobFunctionData)
        .onConflictDoUpdate({
          target: schema.tags.name,
          set: {
            description: sql`excluded.description`,
            vector: sql`excluded.vector`,
          },
        });
    });
    console.log("Job function tag data created successfully.");
  } catch (error) {
    console.error("Failed to update job function tags:", error);
  }
}

async function fetchJobFunctionEmbeddings() {
  console.log("Fetching job function embeddings...");
  const embeddings = await Promise.all(
    job_functions.map(async ({ description, name, keywords }) => {
      const input = `${description} \n keywords: ${keywords.join(", ")}`;
      const embedding = await createEmbedding(input);
      return {
        name,
        description: input,
        vector: embedding,
      };
    }),
  );
  console.log("Job function embeddings fetched successfully.");
  return embeddings;
}
