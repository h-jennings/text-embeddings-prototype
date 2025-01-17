import * as schema from "../db/schema.js";
import job_functions from "../data/job-functions.json" assert { type: "json" };
import { db } from "../db/client.js";
import { createEmbedding } from "../utils/create-embedding.js";

export async function saveJobFunctionTags() {
  const jobFunctionData = await fetchJobFunctionEmbeddings();
  try {
    await db.transaction(async (tx) => {
      await tx.delete(schema.tags);
      await tx.insert(schema.tags).values(jobFunctionData);
    });
  } catch (error) {
    console.error("Failed to update job function tags:", error);
  }
}

async function fetchJobFunctionEmbeddings() {
  return Promise.all(
    job_functions.map(async ({ description, name }) => {
      const embedding = await createEmbedding(description);
      return {
        name,
        description,
        vector: embedding,
      };
    }),
  );
}
