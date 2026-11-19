import { deleteAccount } from "@/services/user.js";
import type { Request, Response, NextFunction } from "express";



export async function updateProfile(req: Request, res: Response, next: NextFunction) {

}


export async function deleteProfile(req: Request, res: Response, next: NextFunction) {
  const userId = req.user!.id;

  try {
    await deleteAccount(userId);
    return res.status(204).send()
  } catch (error) {
    next(error)
  }
}