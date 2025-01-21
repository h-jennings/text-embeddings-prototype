import { z } from "zod";
import he from "he";
import pLimit from "p-limit";

// 1. Pipe through a summarization GPT
// 2. Embed the summary
// 3. Compare with tag table vectors
// 4. Add tags to job

const GreenhouseJobsResponseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      content: z.string(),
      absolute_url: z.string(),
    }),
  ),
});

const LeverJobsResponseSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    hostedUrl: z.string(),
    descriptionPlain: z.string(),
    additionalPlain: z.string(),
  }),
);

function createGreenhouseJobUrl(companyId: string) {
  return `https://api.greenhouse.io/v1/boards/${companyId}/jobs?content=true` as const;
}

function createLeverJobUrl(companyId: string) {
  return `https://api.lever.co/v0/postings/${companyId}?mode=json` as const;
}

const PLATFORMS = ["greenhouse", "lever"] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_COMPANY_MAPPINGS: Record<Platform, Set<string>> = {
  greenhouse: new Set([
    "lyft",
    // "airtable",
    // "datadog",
    // "flexport",
    // "benchling",
    // "webflow",
    // "andurilindustries",
    // "duolingo",
    // "appliedintuition",
    // "via",
    // "sambanovasystems",
    // "latentai",
    // "c3iot",
    // "tanium",
    // "syncro",
    // "sandboxaq",
    // "liveviewtechnologiesinc",
    // "arenaai",
    // "trueanomalyinc",
    // "highwire",
    // "rapp",
    // "imafinancialgroup",
    // "appliedintuition",
    // "sambanovasystems",
    // "gongio",
    // "vannevarlabs",
    // "whatnot",
  ]),
  lever: new Set([
    // "pryon",
    "palantir",
    // "outreach",
    // "rigetti",
    // "ontic",
    // "shieldai",
    // "episci",
    // "govini",
    // "attentive"
  ]),
};

interface Job {
  externalJobId: string;
  title: string;
  description: string;
}
export async function getJobs() {
  const limit = pLimit(5); // Maximum number of concurrent requests
  const results: Job[] = [];

  // Generate tasks for each platform and company
  const tasks = Object.entries(PLATFORM_COMPANY_MAPPINGS).flatMap(([platform, companyIds]) => {
    return Array.from(companyIds).map((companyId) => {
      return limit(async () => {
        try {
          const jobs = await fetchJobsWithRetry(platform as Platform, companyId);
          return jobs;
        } catch (error) {
          console.error(`Failed to fetch jobs for ${companyId} on platform ${platform}:`, error);
          return [];
        }
      });
    });
  });

  // Await all tasks and flatten results
  const taskResults = await Promise.allSettled(tasks);

  for (const result of taskResults) {
    if (result.status === "fulfilled") {
      results.push(...result.value);
    } else {
      console.error("A task failed:", result.reason);
    }
  }

  return results;
}

async function fetchJobs(platform: Platform, companyId: string): Promise<Array<Job>> {
  try {
    switch (platform) {
      case "greenhouse": {
        const response = await fetch(createGreenhouseJobUrl(companyId));

        if (!response.ok) {
          console.error(`Failed to fetch ${companyId}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        const parsed = GreenhouseJobsResponseSchema.parse(data);

        return parsed.jobs.map((job) => {
          return {
            externalJobId: job.id.toString(),
            title: job.title,
            description: he.decode(job.content),
          };
        });
      }
      case "lever": {
        const response = await fetch(createLeverJobUrl(companyId));

        if (!response.ok) {
          console.error(`Failed to fetch ${companyId}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        const parsed = LeverJobsResponseSchema.parse(data);

        return parsed.map((job) => {
          return {
            externalJobId: job.id,
            title: job.text,
            description: job.descriptionPlain + "\n" + job.additionalPlain,
          };
        });
      }
      default: {
        throw new Error("Unsupported platform");
      }
    }
  } catch (error) {
    console.error(`Error processing ${companyId}:`, error);
    return [];
  }
}

async function fetchJobsWithRetry(platform: Platform, companyId: string, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const jobs = await fetchJobs(platform, companyId);
      return jobs;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for ${companyId}:`, error);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return [];
}

getJobs().then((response) => {
  console.log(response);
});
