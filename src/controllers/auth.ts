import type { Request, Response, NextFunction } from "express";
import * as authService from "@/services/auth.js";



export async function register(req: Request, res: Response, next: NextFunction) {

  try {
    const result = await authService.registerUser(
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

  try {
    const result = await authService.loginUser(
      req.body.identifier,
      req.body.password
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error)
  }
}


export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = req.body;

    const result = await authService.googleLogin(idToken);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}


export async function refresh(req: Request, res: Response, next: NextFunction) {

  try {
    const result = await authService.refreshUser(req.body.refreshToken);

    return res.status(200).json(result);

  } catch (error) {
    next(error)
  }
}


export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logoutUser(req.body.refreshToken);

    return res.status(200).json({
      message: "Logged out successfully"
    });

  } catch (error) {
    next(error)
  }
}