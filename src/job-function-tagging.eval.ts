import { createScorer, evalite } from "evalite";
import data from "./data/job-test-data.json" assert { type: "json" };
import { createJobSummary } from "./processors/create-job-summary/create-job-summary.js";
import { createEmbedding } from "./utils/create-embedding.js";
import { getTags } from "./utils/get-tags.js";

const includesExpectedTag = createScorer<{ jobFunctionTags: Array<string> }, Array<{ name: string; score: number }>>({
  name: "Includes Expected Tags",
  description: "The tags generated are correct.",
  scorer: ({ output, input }) => {
    const outputTags = output.map((tag) => tag.name);
    const expectedTags = input.jobFunctionTags;
    return expectedTags.every((tag) => outputTags.includes(tag)) ? 1 : 0;
  },
});

evalite("Correctly tags a role with job function", {
  data: () => {
    return data.map((item) => {
      return {
        input: item,
      };
    });
  },
  task: async (input) => {
    const summary = await createJobSummary(2, { title: input.title, description: input.description });
    const embedding = await createEmbedding(summary);
    const tags = await getTags(embedding);

    return tags.map((tag) => {
      return {
        name: tag.name,
        score: tag.score,
      };
    });
  },
  scorers: [includesExpectedTag],
});
