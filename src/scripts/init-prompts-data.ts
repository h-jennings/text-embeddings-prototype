import prompts from "../data/prompts.json" assert { type: "json" };
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

export async function createPromptsData() {
  console.log("Starting to create prompts data...");
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.jobSummaryPrompts)
        .values(
          prompts.map((prompt): schema.NewJobSummaryPrompt => {
            return {
              content: prompt.prompt,
              id: prompt.id,
            };
          }),
        )
        .onConflictDoNothing();
    });
    console.log("Prompts data created successfully.");
  } catch (error) {
    console.error("Failed to update prompts data:", error);
  }
}
