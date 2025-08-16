import { pgTable, varchar, text, jsonb, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar({ length: 256 }).primaryKey().notNull(),
  full_name: text(),
  "MetaMask Wallet Address": varchar({ length: 256 }),
  email: varchar({ length: 256 }),
});

export const hackathons = pgTable("hackathons", {
  id: uuid().primaryKey().notNull(),
  name: varchar({ length: 256 }).notNull(),
  description: text(),
  start_date: timestamp().notNull(),
  end_date: timestamp().notNull(),
  image_url: varchar({ length: 256 }),
  status: varchar({ length: 50 }).default("upcoming"),
  created_at: timestamp().defaultNow(),
  created_by: varchar({ length: 256 }).references(() => users.id),
});

export const hack_projects = pgTable("hack_projects", {
  id: uuid().primaryKey().notNull(),
  hackathon_id: uuid()
    .references(() => hackathons.id)
    .notNull(),
  project_name: varchar({ length: 256 }).notNull(),
  description: text(),
  repository: varchar({ length: 256 }),
  image_url: varchar({ length: 256 }),
  owner_id: varchar({ length: 256 })
    .references(() => users.id)
    .notNull(),
  team_members: jsonb(),
  tech_stack: jsonb(),
  contract_address: varchar({ length: 256 }),
  created_at: timestamp().defaultNow(),
});

export const project_votes = pgTable("project_votes", {
  id: uuid().primaryKey().notNull(),
  project_id: uuid()
    .references(() => hack_projects.id)
    .notNull(),
  voter_id: varchar({ length: 256 })
    .references(() => users.id)
    .notNull(),
  vote_type: varchar({ length: 50 }).notNull(),
  created_at: timestamp().defaultNow(),
});

export const project_split_payments = pgTable("project_split_payments", {
  id: uuid().primaryKey().notNull(),
  project_id: uuid()
    .references(() => hack_projects.id)
    .notNull(),
  total_amount: varchar({ length: 256 }).notNull(),
  contributor_share: varchar({ length: 256 }).notNull(),
  maintainer_share: varchar({ length: 256 }).notNull(),
  transaction_hash: varchar({ length: 256 }),
  status: varchar({ length: 50 }).default("pending"),
  created_at: timestamp().defaultNow(),
});
