import { createCompaniesData } from "../scripts/init-companies-data.js";
import { createJobsData } from "../scripts/init-jobs-data.js";
import { createPlatformsData } from "../scripts/init-platforms-data.js";
import { createPromptsData } from "../scripts/init-prompts-data.js";
import { createSegmentsData } from "../scripts/init-segments-data.js";
import { createJobFunctionTagData } from "../scripts/init-tags-data.js";

async function main() {
  try {
    console.log("Starting seed process...");

    // Step 1: Independent operations
    console.log("Creating platforms and tags...");
    await createPlatformsData();
    await createJobFunctionTagData();
    await createPromptsData();

    // Step 2: Segments (depends on tags)
    console.log("Creating segments...");
    await createSegmentsData();

    // Step 3: Companies (depends on platforms)
    console.log("Creating companies...");
    await createCompaniesData();

    // Step 4: Jobs (depends on companies)
    console.log("Creating jobs...");
    await createJobsData();

    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

main();
