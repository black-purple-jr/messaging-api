import express from "express";
import morgan from "morgan";

import authRouter from "@/routes/auth.js";
import userRouter from "@/routes/user.js";
import friendRequestRouter from "@/routes/friend-request.js";
import friendRouter from "./routes/friend.js";

import errorMiddleware from "@/middleware/error.js";


const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/auth", authRouter);
app.use("/u", userRouter);
app.use("/friend-request", friendRequestRouter);
app.use("/friends", friendRouter);

app.get("/", (req, res) => {
  res.json({ message: "Messaging API is running" });
});

app.use(errorMiddleware);

export default app;