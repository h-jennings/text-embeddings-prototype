import { db } from "./client.js";
import { companies, jobs, platforms, tags, tagsToJobs } from "./schema.js";

export async function clearDatabaseRecords() {
  try {
    console.log("Cleaning up existing data...");

    // Delete in correct order to respect foreign keys
    await db.delete(tagsToJobs);
    await db.delete(jobs);
    await db.delete(companies);
    await db.delete(tags);
    await db.delete(platforms);

    console.log("Database cleared successfully");
  } catch (error) {
    console.error("Clear failed:", error);
    throw error;
  }
}
clearDatabaseRecords();
