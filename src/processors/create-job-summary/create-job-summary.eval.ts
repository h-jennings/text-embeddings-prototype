import { createScorer, evalite } from "evalite";
import { createJobSummary } from "./create-job-summary.js";
import { data } from "../../data/job-summary-test-data.js";

const isCorrectLength = createScorer<unknown, string>({
  name: "Is Correct Length",
  description: "The LLM output falls within the specified length",
  scorer: ({ output }) => {
    return output.length < 1000 ? 1 : 0;
  },
});

const mentionsRole = createScorer<{ role: string }, string>({
  name: "Mentions role in summary",
  description: "The summary of the job should mention the role by name",
  scorer: ({ input, output }) => {
    return output.toLowerCase().includes(input.role.toLowerCase()) ? 1 : 0;
  },
});

evalite("Job summary creator", {
  data: () => {
    return data.map((item) => {
      return {
        input: item,
      };
    });
  },
  task: async (input) => {
    const summary = await createJobSummary(2, { title: input.title, description: input.description });

    return summary;
  },
  // The scoring methods for the eval
  scorers: [isCorrectLength, mentionsRole],
});
