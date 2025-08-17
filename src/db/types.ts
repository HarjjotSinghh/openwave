import { type } from "os";
import { hack_projects, project_votes, project_split_payments, users } from "./schema";

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export type Project = typeof hack_projects.$inferSelect;
export type ProjectInsert = typeof hack_projects.$inferInsert;

export type ProjectVotes = typeof project_votes.$inferSelect;
export type ProjectVotesInsert = typeof project_votes.$inferInsert;

export type SplitPayment = typeof project_split_payments.$inferSelect;
export type SplitPaymentInsert = typeof project_split_payments.$inferInsert;
