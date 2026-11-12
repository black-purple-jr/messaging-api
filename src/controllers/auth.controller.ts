import type { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";



export async function register (req: Request, res: Response) {
  registerUser(
    req.body.email,
    req.body.username,
    req.body.password,
    req.body.firstName,
    req.body.lastName,
    req.body.displayName
  );
};

export async function login (req: Request, res: Response) {
  loginUser(
    req.body.identifier,
    req.body.password
  );
};

export async function logout(req: Request, res: Response) {
  
};