import { db } from "./client.js";
import * as schema from "./schema.js";

export async function clearDatabaseRecords() {
  try {
    console.log("Cleaning up existing data...");

    // 1. Delete junction tables first
    await db.delete(schema.tagsToJobs);
    await db.delete(schema.jobSummaries);

    // 2. Delete dependent entities
    await db.delete(schema.jobs);
    await db.delete(schema.tags);
    await db.delete(schema.jobSummaryPrompts);

    // 3. Delete companies (depends on platforms)
    await db.delete(schema.companies);

    // 4. Delete root entities
    await db.delete(schema.platforms);

    console.log("Database cleared successfully");
  } catch (error) {
    console.error("Clear failed:", error);
    throw error;
  }
}
clearDatabaseRecords();
