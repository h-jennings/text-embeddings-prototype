import { eq } from "drizzle-orm";
import { db } from "./db/client.js";
import { companies, jobs, jobSummaries, jobSummaryPrompts } from "./db/schema.js";
import { openai } from "./lib/openai.js";

const PALANTIR_ID = 27 as const;
async function main() {
  // Fixed query to reference the jobs table correctly
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.company_id, PALANTIR_ID),
  });

  if (!job) return;

  const { title, description, id } = job ?? {};
  const PROMPT_ID = 2;
  const prompt = await getPrompt(PROMPT_ID, { title: title ?? "", description: description ?? "" });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: [
      { role: "system", content: "You are a professional text summarizer for a job classification pipeline." },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
  });

  // TODO: you wantd to improve the prompt so that it doesn't include any information that won't matter for tagging, like comp for example...
  const summary = response.choices[0].message.content;

  await db.insert(jobSummaries).values({
    job_id: id,
    prompt_id: PROMPT_ID,
    summary: summary ?? "",
  });

  return summary;
}

async function getPrompt(id: number, { title, description }: { title: string; description: string }) {
  const prompt = await db.query.jobSummaryPrompts.findFirst({
    where: eq(jobSummaryPrompts.id, id),
  });

  return (
    prompt?.content.replace(/\{(\w+)\}/g, (_, key) => {
      const replacements = { title, description };

      return replacements[key as keyof typeof replacements] ?? "";
    }) ?? ""
  );
}
main();
