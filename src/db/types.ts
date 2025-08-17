import { type } from "os";
import { users } from "./schema";

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

