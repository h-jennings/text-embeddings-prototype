import { relations } from "drizzle-orm";
import * as s from "drizzle-orm/sqlite-core";

export const tags = s.sqliteTable("tags", {
  id: s.integer().primaryKey().notNull(),
  name: s.text().notNull(),
  description: s.text().notNull(),
  vector: s.text({ mode: "json" }).$type<Array<number>>(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  tagsToJobs: many(tagsToJobs),
}));

export const jobs = s.sqliteTable("jobs", {
  id: s.integer().primaryKey().notNull(),
  url: s.text().notNull().unique(),
  title: s.text().notNull(),
  description: s.text(),
});

export const jobsRelations = relations(jobs, ({ many }) => ({
  tagsToJobs: many(tagsToJobs),
}));

export const tagsToJobs = s.sqliteTable(
  "tags_to_jobs",
  {
    tagId: s.integer("tag_id").references(() => tags.id),
    jobId: s.integer("job_id").references(() => jobs.id),
  },
  (t) => [s.primaryKey({ columns: [t.tagId, t.jobId] })],
);

export const tagsToJobsRelations = relations(tagsToJobs, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToJobs.tagId],
    references: [tags.id],
  }),
  job: one(jobs, {
    fields: [tagsToJobs.jobId],
    references: [jobs.id],
  }),
}));
