import * as userService from "@/services/user.js";
import type { Request, Response, NextFunction } from "express";


export async function getProfileData(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const userData = await userService.getProfileData(userId);

    return res.status(200).json(userData);

  } catch (error) {
    next(error);
  }

}


export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const updatedUser = await userService.updateProfile(
      userId,
      req.body
    );

    return res.status(200).json(updatedUser);
  } catch (error) {
    return next(error);
  }
}


export async function deleteProfile(req: Request, res: Response, next: NextFunction) {
  const userId = req.user!.id;

  try {
    await userService.deleteAccount(userId);
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}