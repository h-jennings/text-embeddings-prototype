import { eq, isNull, notExists } from "drizzle-orm";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

export async function retrieveJobDetailsWithTags() {
  const jobs = await db
    .select()
    .from(schema.jobs)
    .innerJoin(schema.tagsToJobs, eq(schema.jobs.id, schema.tagsToJobs.job_id))
    .innerJoin(schema.tags, eq(schema.tagsToJobs.tag_id, schema.tags.id));

  const companiesMap = await db
    .select()
    .from(schema.companies)
    .execute()
    .then((companies) => {
      return companies.reduce(
        (acc, curr) => {
          acc[curr.id] = {
            name: curr.name,
          };

          return acc;
        },
        {} as Record<number, { name: string }>,
      );
    });

  const jobListingsById = jobs.reduce(
    (acc, { jobs, tags }) => {
      acc[jobs.id] = {
        title: jobs.title,
        company: companiesMap[jobs.company_id] ?? null,
        tags: [...(acc[jobs.id]?.tags ?? []), tags.name],
      };
      return acc;
    },
    {} as Record<
      number,
      {
        title: string;
        company: {
          name: string;
        } | null;
        tags: Array<string>;
      }
    >,
  );

  return Object.values(jobListingsById).reduce(
    (acc, value) => {
      const companyName = value.company?.name ?? "unknown";
      if (!acc[companyName]) {
        acc[companyName] = { jobs: [] };
      }
      acc[companyName].jobs.push(value);

      return acc;
    },
    {} as Record<
      string,
      {
        jobs: Array<typeof jobListingsById>;
      }
    >,
  );
}

retrieveJobDetailsWithTags().then((res) => {
  console.log(res);
});
