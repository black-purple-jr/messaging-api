import { deleteAccount } from "@/services/user.service.js";
import type { Request, Response, NextFunction } from "express";

export async function deleteProfile (req: Request, res: Response, next: NextFunction) {
  const userId = req.user!.id;

  try {
    await deleteAccount(userId);
    return res.status(204).send()
  } catch (error) {
    next(error)
  }
}