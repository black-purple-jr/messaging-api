import { z } from "zod";


export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(1)
});

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1)
});