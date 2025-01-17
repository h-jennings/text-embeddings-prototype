import OpenAI from "openai";
import { ANDURIL_TEST_JD, JOB_FUNCTIONS, MARKON_JD, PRIMER_AI_JD, VANTA_PARTNERS_JD } from "./data";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

async function getJobFunctionTags(jobDescription: string) {
  const jobFunctionEmbeddings = await Promise.all(
    Array.from(JOB_FUNCTIONS.entries()).map(async ([description, key]) => {
      const embedding = await createEmbedding(description);
      return [key, embedding] as const;
    }),
  );

  const jobDescriptionEmbedding = await createEmbedding(jobDescription);

  return jobFunctionEmbeddings
    .filter(([, vector]) => {
      const score = cosineSimilarity(jobDescriptionEmbedding, vector);

      return score > 0.34;
    })
    .map(([key]) => key);
}

async function createEmbedding(input: string) {
  const embedding = await openai.embeddings.create({
    input,
    model: "text-embedding-3-large",
    encoding_format: "float",
  });

  return embedding.data.map((v) => v.embedding)[0];
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
