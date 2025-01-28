import { openai } from "../../lib/openai.js";
import { getPrompt } from "../../utils/get-prompt.js";
import { removeStopwords } from "../../utils/stopwords.js";

export async function createJobSummary(
  promptId: number,
  { title, description }: { title: string; description: string },
) {
  const prompt = await getPrompt(promptId, { title, description: description ?? "" });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: "You are a professional text summarizer for a job classification pipeline.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
  });

  const summary = response.choices[0].message.content;
  const refinedSummary = removeStopwords(summary?.split(" ") ?? []).join(" ");

  return refinedSummary;
}
