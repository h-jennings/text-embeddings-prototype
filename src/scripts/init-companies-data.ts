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
