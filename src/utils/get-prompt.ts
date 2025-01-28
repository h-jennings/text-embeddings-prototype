import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

export async function getPrompt(id: number, { title, description }: { title: string; description: string }) {
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
