import { db } from "./db/client.js";
import * as schema from "./db/schema.js";
import { isNotNull } from "drizzle-orm";
import { MARKON_JD } from "./data.js";
import { createEmbedding } from "./utils/create-embedding.js";

async function getJobFunctionTags(jobDescription: string) {
  const jobFunctionEmbeddings = await db.select().from(schema.tags).where(isNotNull(schema.tags.vector));

  const jobDescriptionEmbedding = await createEmbedding(jobDescription);

  return jobFunctionEmbeddings
    .filter(({ vector }) => {
      const score = cosineSimilarity(jobDescriptionEmbedding, vector!);

      return score > 0.34;
    })
    .map(({ name }) => name);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = dot(a, b);
  const magnitudeA = Math.sqrt(dot(a, a));
  const magnitudeB = Math.sqrt(dot(b, b));
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, val, index) => sum + val * b[index], 0);
}

// Run program
getJobFunctionTags(MARKON_JD).then((tags) => {
  console.log(tags);
});
