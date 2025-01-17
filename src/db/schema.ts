import * as s from "drizzle-orm/sqlite-core";

export const tags = s.sqliteTable("tags", {
  id: s.integer().primaryKey().notNull(),
  name: s.text().notNull(),
  description: s.text().notNull(),
  vector: s.text({ mode: "json" }).$type<Array<number>>(),
});
