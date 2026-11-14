import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config/env.js";



export default function authenticate (req: Request, res: Response, next: NextFunction) {

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid authorization header"
    });
  }

  try {

    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({
        message: "Invalid access token"
      });
    }

    req.user = { id: payload.sub };

    next();

  } catch (error) {

  }
}