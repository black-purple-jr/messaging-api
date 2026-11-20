import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z.string().trim().min(3).max(30).optional(),
  displayName: z.string().trim().min(1).max(50).optional(),
  avatar: z.url().nullable().optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
