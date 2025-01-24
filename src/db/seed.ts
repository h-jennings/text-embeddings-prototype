import { createCompaniesData } from "../scripts/init-companies-data.js";
import { createJobsData } from "../scripts/init-jobs-data.js";
import { createPlatformsData } from "../scripts/init-platforms-data.js";
import { createJobFunctionTagData } from "../scripts/init-tags-data.js";

async function main() {
  await Promise.all([createJobFunctionTagData(), createPlatformsData()]);
  await createCompaniesData();
  await createJobsData();
}
main();
