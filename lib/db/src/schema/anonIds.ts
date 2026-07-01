import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const anonIdsTable = pgTable("anon_ids", {
  realId: text("real_id").primaryKey(),
  anonId: text("anon_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type AnonIdRow = typeof anonIdsTable.$inferSelect;
