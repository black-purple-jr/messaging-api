import { Router } from "express";
import * as authController from "@/controllers/auth.js";
import  validate  from "@/middleware/validate.js";
import { registerSchema, loginSchema, refreshSchema, logoutSchema, googleLoginSchema } from "@/schemas/auth.js";


const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/login/google", validate(googleLoginSchema), authController.googleLogin);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/logout", validate(logoutSchema), authController.logout);

export default authRouter;