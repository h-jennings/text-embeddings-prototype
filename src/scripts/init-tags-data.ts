import * as schema from "../db/schema.js";
import job_functions from "../data/job-functions.json" assert { type: "json" };
import { db } from "../db/client.js";
import { createEmbedding } from "../utils/create-embedding.js";

export async function createJobFunctionTagData() {
  console.log("Starting to create job function tag data...");
  const jobFunctionData = await fetchJobFunctionEmbeddings();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(schema.tags).values(jobFunctionData).onConflictDoNothing();
    });
    console.log("Job function tag data created successfully.");
  } catch (error) {
    console.error("Failed to update job function tags:", error);
  }
}

async function fetchJobFunctionEmbeddings() {
  console.log("Fetching job function embeddings...");
  const embeddings = await Promise.all(
    job_functions.map(async ({ description, name }) => {
      const embedding = await createEmbedding(description);
      return {
        name,
        description,
        vector: embedding,
      };
    }),
  );
  console.log("Job function embeddings fetched successfully.");
  return embeddings;
}
