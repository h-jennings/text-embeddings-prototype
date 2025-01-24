import { relations, sql } from "drizzle-orm";
import * as s from "drizzle-orm/sqlite-core";

export const platforms = s.sqliteTable("platforms", {
  id: s.integer().primaryKey().notNull(),
  created_at: s
    .text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: s
    .text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  name: s.text().notNull().unique(),
});

export const platformsRelations = relations(platforms, ({ many }) => ({
  companies: many(companies),
}));

export const companies = s.sqliteTable("companies", {
  id: s.integer().primaryKey().notNull(),
  created_at: s
    .text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: s
    .text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  name: s.text().notNull(),
  external_company_id: s.text().notNull().unique(),
  platform_id: s
    .integer()
    .notNull()
    .references(() => platforms.id),
});
export type NewCompany = typeof companies.$inferInsert;
export type Company = typeof companies.$inferSelect;

export const companiesRelations = relations(companies, ({ many, one }) => ({
  jobs: many(jobs),
  platform: one(platforms, {
    fields: [companies.platform_id],
    references: [platforms.id],
  }),
}));

export const tags = s.sqliteTable("tags", {
  id: s.integer().primaryKey().notNull(),
  created_at: s
    .text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: s
    .text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  name: s.text().notNull().unique(),
  description: s.text().notNull(),
  vector: s
    .text({ mode: "json" })
    .$type<Array<number>>()
    .default(sql`'[]'`),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  tags_to_jobs: many(tagsToJobs),
}));

export const jobs = s.sqliteTable(
  "jobs",
  {
    id: s.integer().primaryKey().notNull(),
    created_at: s
      .text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: s
      .text("updated_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    url: s.text().notNull().unique(),
    title: s.text().notNull(),
    description: s.text(),
    external_job_id: s.text().notNull().unique(),
    external_job_url: s.text().notNull().unique(),
    company_id: s
      .integer("company_id")
      .notNull()
      .references(() => companies.id),
  },
  (table) => [s.index("company_id_idx").on(table.company_id)],
);
export const jobsRelations = relations(jobs, ({ many, one }) => ({
  tags_to_jobs: many(tagsToJobs),
  company: one(companies, {
    fields: [jobs.company_id],
    references: [companies.id],
  }),
  summaries: many(jobSummaries),
}));
export type NewJob = typeof jobs.$inferInsert;

export const jobSummaries = s.sqliteTable("job_summaries", {
  id: s.integer().primaryKey().notNull(),
  created_at: s
    .text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: s
    .text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  job_id: s
    .integer()
    .notNull()
    .references(() => jobs.id),
  prompt_id: s
    .integer()
    .notNull()
    .references(() => jobSummaryPrompts.id),
  summary: s.text().notNull(),
  vector: s
    .text({ mode: "json" })
    .$type<Array<number>>()
    .default(sql`'[]'`),
});

export const jobSummariesRelations = relations(jobSummaries, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSummaries.job_id],
    references: [jobs.id],
  }),
  prompt: one(jobSummaryPrompts, {
    fields: [jobSummaries.prompt_id],
    references: [jobSummaryPrompts.id],
  }),
}));

export const jobSummaryPrompts = s.sqliteTable("job_summary_prompts", {
  id: s.integer().primaryKey().notNull(),
  created_at: s
    .text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: s
    .text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  content: s.text().notNull(),
  description: s.text(),
});

export const jobSummaryPromptsRelations = relations(jobSummaryPrompts, ({ many }) => ({
  summaries: many(jobSummaries),
}));

export const tagsToJobs = s.sqliteTable(
  "tags_to_jobs",
  {
    tag_id: s.integer("tag_id").references(() => tags.id),
    job_id: s.integer("job_id").references(() => jobs.id),
  },
  (table) => [s.primaryKey({ columns: [table.tag_id, table.job_id] })],
);

export const tagsToJobsRelations = relations(tagsToJobs, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToJobs.tag_id],
    references: [tags.id],
  }),
  job: one(jobs, {
    fields: [tagsToJobs.job_id],
    references: [jobs.id],
  }),
}));
