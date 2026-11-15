import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from "@/config/env.js";


export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn: "20m" }
  )
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  )
}