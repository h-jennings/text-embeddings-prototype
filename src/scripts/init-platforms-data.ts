import { PLATFORM_COMPANY_MAPPINGS } from "../data/companies.js";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

export async function createPlatformsData() {
  console.log("Starting to create platforms data...");
  const platforms = Object.keys(PLATFORM_COMPANY_MAPPINGS);
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.platforms)
        .values(
          platforms.map((plat) => {
            return {
              name: plat,
            };
          }),
        )
        .onConflictDoNothing();
    });
    console.log("Platforms data created successfully.");
  } catch (error) {
    console.error("Failed to update/create companies data:", error);
  }
}
