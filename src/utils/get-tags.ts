import { isNotNull } from "drizzle-orm";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";
import { cosineSimilarity } from "./cosine-similarity.js";

export async function getTags(inputVector: Array<number>, threshold = 0.5) {
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
    return score > threshold;
  });

  return tags;
}
