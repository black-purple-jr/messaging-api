import express from "express";
import dotenv from "dotenv";
import authRouter from "@/routes/auth.router.js"
import connectDatabase from "@/config/database.js";
import userRouter from "@/routes/user.router.js";
import errorMiddleware from "@/middleware/error.middleware.js";
dotenv.config()

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

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
app.use("/u", userRouter);


app.use(errorMiddleware);

startServer();

app.get("/", (req, res) => {
  res.json({ message: "Messaging API is running" });
});