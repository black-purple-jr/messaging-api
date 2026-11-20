import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from "@/config/env.js";
import AppError from "./app-error.js";


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
    { expiresIn: "20d" }
  )
}

export function verifyRefreshToken(token: string): string {
  let payload;

  try {
    payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new AppError("Invalid refresh token", 401);
  }

  return payload.sub;
}