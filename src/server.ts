import express from "express";
import morgan from "morgan";
import authRouter from "@/routes/auth.router.js"
import connectDatabase from "@/config/database.js";
import userRouter from "@/routes/user.router.js";
import errorMiddleware from "@/middleware/error.middleware.js";
import authenticate from "@/middleware/auth.middleware.js";
import { PORT } from "@/config/env.js";

const app = express();


app.use(express.json());
app.use(morgan('dev'));


async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start the server : ${error}`);
    process.exit(1);
  }
};

app.use("/auth", authRouter);
app.use("/u", authenticate, userRouter);


app.get("/", (req, res) => {
  res.json({ message: "Messaging API is running" });
});


app.use(errorMiddleware);

startServer();