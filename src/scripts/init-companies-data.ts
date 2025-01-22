import * as schema from "../db/schema.js";
import { db } from "../db/client.js";

export async function savePlatformsData() {
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
  } catch (error) {
    console.error("Failed to update/create companies data:", error);
  }
}

export async function saveCompaniesData() {
  const platformsMap = await db
    .select()
    .from(schema.platforms)
    .execute()
    .then((platforms) => {
      return platforms.reduce(
        (map, platform) => {
          map[platform.name] = platform.id;
          return map;
        },
        {} as Record<string, number>,
      );
    });

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
    await db.transaction(async (tx) => {
      await tx.insert(schema.companies).values(companies).onConflictDoNothing();
    });
    console.log("Companies saved successfully.");
  } catch (error) {
    console.error("Failed to save companies data:", error);
  }
}

const PLATFORMS = ["greenhouse", "lever"] as const;
type Platform = (typeof PLATFORMS)[number];
const PLATFORM_COMPANY_MAPPINGS: Record<Platform, Set<string>> = {
  greenhouse: new Set([
    "lyft",
    "airtable",
    "datadog",
    "flexport",
    "benchling",
    "webflow",
    "andurilindustries",
    "duolingo",
    "appliedintuition",
    "via",
    "sambanovasystems",
    "latentai",
    "c3iot",
    "tanium",
    "syncro",
    "sandboxaq",
    "liveviewtechnologiesinc",
    "arenaai",
    "trueanomalyinc",
    "highwire",
    "rapp",
    "imafinancialgroup",
    "appliedintuition",
    "sambanovasystems",
    "gongio",
    "vannevarlabs",
    "whatnot",
  ]),
  lever: new Set(["pryon", "palantir", "outreach", "rigetti", "ontic", "shieldai", "episci", "govini", "attentive"]),
};
