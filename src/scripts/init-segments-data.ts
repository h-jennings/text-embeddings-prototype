import { db } from "../db/client.js";
import * as schema from "../db/schema.js";
import job_functions from "../data/job-functions.json" assert { type: "json" };
import { createEmbedding } from "../utils/create-embedding.js";
import { sql } from "drizzle-orm";

export async function createSegmentsData() {
  const tagIdMapping = new Map<string, number>(
    (
      await db
        .select({
          name: schema.tags.name,
          id: schema.tags.id,
        })
        .from(schema.tags)
        .execute()
    ).map((tag) => [tag.name, tag.id]),
  );

  const tasks = await Promise.all(
    job_functions.flatMap(({ name, segments }) => {
      const tagId: number | undefined = tagIdMapping.get(name);

      if (!tagId) return [];

      return (
        segments?.map(async ({ name, description, keywords }): Promise<schema.NewSegment> => {
          const input = `${name} ${description} \nkeywords: ${keywords.join(", ")}`;
          const embedding = await createEmbedding(input);
          return {
            name,
            description: input,
            tag_id: tagId,
            vector: embedding,
          };
        }) ?? []
      );
    }),
  );

  try {
    await db
      .insert(schema.segments)
      .values(tasks)
      .onConflictDoUpdate({
        target: schema.segments.name,
        set: {
          description: sql`excluded.description`,
          vector: sql`excluded.vector`,
          tag_id: sql`excluded.tag_id`,
        },
      });

    console.log("Job segment data inserted/updated successfully");
  } catch (error) {
    console.error("Failed to update segments:", error);
  }
}
