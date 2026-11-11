import express from "express";

const authRouter = express.Router();

authRouter.get("/login", (req, res) => {});
authRouter.get("/register", (req, res) => {});
authRouter.get("/refresh", (req, res) => {});

export default authRouter;