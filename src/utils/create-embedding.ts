import { openai } from "../lib/openai.js";

export async function createEmbedding(input: string) {
  const embedding = await openai.embeddings.create({
    input,
    model: "text-embedding-3-large",
    encoding_format: "float",
  });

  return embedding.data.map((v) => v.embedding)[0];
}
