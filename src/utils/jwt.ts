import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config/env.js";


export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn: "20m" }
  )
}