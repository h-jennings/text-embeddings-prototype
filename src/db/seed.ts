import { saveCompaniesData, savePlatformsData } from "../scripts/init-companies-data.js";
import { saveJobFunctionTags } from "../scripts/init-tags-data.js";

async function main() {
  await Promise.all([saveJobFunctionTags(), savePlatformsData()]);
  await Promise.all([saveCompaniesData()]);
}
main();
