import * as schema from "../db/schema.js";
import { db } from "../db/client.js";
import { PLATFORM_COMPANY_MAPPINGS } from "../data/companies.js";
import { getPlatforms } from "../utils/get-platforms.js";

export async function createCompaniesData() {
  console.log("Starting to create companies data...");
  const platformsMap = await getPlatforms();

  const companies: Array<schema.NewCompany> = [];
  for (const [platformName, companyIds] of Object.entries(PLATFORM_COMPANY_MAPPINGS)) {
    const platformId = platformsMap[platformName];
    if (!platformId) {
      console.warn(`Platform with name "${platformName}" not found. Skipping associated companies.`);
      continue;
    }

    for (const company of companyIds) {
      companies.push({
        name: company,
        platform_id: platformId,
        external_company_id: company,
      });
    }
  }

  // Insert companies in bulk
  try {
    await db.insert(schema.companies).values(companies).onConflictDoNothing();
    console.log("Companies saved successfully.");
  } catch (error) {
    console.error("Failed to save companies data:", error);
  }
}
