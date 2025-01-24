import * as schema from "../db/schema.js";
import { z } from "zod";
import he from "he";
import pLimit from "p-limit";
import { Platform } from "../data/companies.js";
import { db } from "../db/client.js";
import { getPlatforms } from "../utils/get-platforms.js";
import { sql } from "drizzle-orm";

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

interface Job {
  title: string;
  description: string;
  externalJobId: string;
  externalJobUrl: string;
}

interface JobFetchResult {
  companyId: number;
  companyName: string;
  success: boolean;
  jobsProcessed: number;
  error?: string;
}
export async function createJobsData() {
  console.log("Starting to create jobs data...");
  const limit = pLimit(5); // Maximum number of concurrent requests
  const companies = await db.select().from(schema.companies);
  const results: Array<JobFetchResult> = [];

  const tasks = companies.map((company) => {
    return limit(async () => {
      try {
        const jobs = await fetchJobsWithRetry(company.platform_id, company.external_company_id);

        if (jobs.length > 0) {
          await db
            .insert(schema.jobs)
            .values(
              jobs.map((job): schema.NewJob => {
                return {
                  title: job.title,
                  description: job.description,
                  external_job_id: job.externalJobId,
                  external_job_url: job.externalJobUrl,
                  url: job.externalJobUrl,
                  company_id: company.id,
                };
              }),
            )
            .onConflictDoUpdate({
              target: schema.jobs.external_job_id,
              set: {
                title: sql`excluded.title`,
                description: sql`excluded.description`,
                updated_at: sql`CURRENT_TIMESTAMP`,
              },
            });

          results.push({
            companyId: company.id,
            companyName: company.name,
            success: true,
            jobsProcessed: jobs.length,
          });

          console.log(`Processed ${jobs.length} jobs for company ${company.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to process jobs for company ${company.name}:`, errorMessage);

        results.push({
          companyId: company.id,
          companyName: company.name,
          success: false,
          jobsProcessed: 0,
          error: errorMessage,
        });
      }
    });
  });

  await Promise.all(tasks);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalJobs = results.reduce((sum, r) => sum + r.jobsProcessed, 0);

  console.log(`Job fetch complete. Companies: ${succeeded} succeeded, ${failed} failed. Total jobs: ${totalJobs}`);
}

async function fetchJobs(platformId: number, companyId: string): Promise<Array<Job>> {
  console.log(`Fetching jobs for company ${companyId} on platform ${platformId}...`);
  try {
    switch (platformId) {
      case 1: {
        const response = await fetch(createGreenhouseJobUrl(companyId));

        if (!response.ok) {
          console.error(`Failed to fetch ${companyId}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        const parsed = GreenhouseJobsResponseSchema.parse(data);

        console.log(`Fetched ${parsed.jobs.length} jobs for company ${companyId} from Greenhouse.`);
        return parsed.jobs.map((job) => {
          return {
            title: job.title,
            description: he.decode(job.content),
            externalJobId: job.id.toString(),
            externalJobUrl: job.absolute_url,
          };
        });
      }
      case 2: {
        const response = await fetch(createLeverJobUrl(companyId));

        if (!response.ok) {
          console.error(`Failed to fetch ${companyId}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        const parsed = LeverJobsResponseSchema.parse(data);

        console.log(`Fetched ${parsed.length} jobs for company ${companyId} from Lever.`);
        return parsed.map((job) => {
          return {
            title: job.text,
            description: job.descriptionPlain + "\n" + job.additionalPlain,
            externalJobId: job.id,
            externalJobUrl: job.hostedUrl,
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

async function fetchJobsWithRetry(platformId: number, companyId: string, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries} to fetch jobs for company ${companyId}...`);
      const jobs = await fetchJobs(platformId, companyId);
      return jobs;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for ${companyId}:`, error);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return [];
}
