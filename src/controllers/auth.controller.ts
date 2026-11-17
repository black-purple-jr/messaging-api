import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, refreshUser, logoutUser } from "@/services/auth.service.js";



export async function register(req: Request, res: Response, next: NextFunction) {

  try {
    const result = await registerUser(
      req.body.email,
      req.body.username,
      req.body.password,
      req.body.displayName
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  };
}


export async function login(req: Request, res: Response, next: NextFunction) {
  
  try{
    const result = await loginUser(
      req.body.identifier,
      req.body.password
    );

    return res.status(200).json(result);
  } catch(error) {
    next(error)
  }
}


export async function refresh (req: Request, res: Response, next: NextFunction) {

  try {
    const result = await refreshUser(req.body.refreshToken);

    return res.status(200).json(result);

  } catch (error) {
    next(error)
  }
}


export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await logoutUser(req.body.refreshToken);

    return res.status(200).json({
      message: "Logged out successfully"
    });

  } catch (error) {
    next(error)
  }
}