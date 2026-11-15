import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, logoutUser } from "@/services/auth.service.js";



export async function register(req: Request, res: Response, next: NextFunction) {

  try {
    const result = await registerUser(
      req.body.email,
      req.body.username,
      req.body.password,
      req.body.firstName,
      req.body.lastName,
      req.body.displayName
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  };

};

export async function login(req: Request, res: Response, next: NextFunction) {
  
  try{
    const result = await loginUser(
      req.body.identifier,
      req.body.password
    );

    return res.status(201).json(result);
  } catch(error) {
    next(error)
  }
};

export async function refresh (req: Request, res: Response, next: NextFunction) {



};

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      return res.status(400).json({
        message: "Refresh token is required"
      });
    }

    await logoutUser(refreshToken);

    return res.status(200).json({
      message: "Logged out successfully"
    });

  } catch (error) {
    next(error)
  }

};