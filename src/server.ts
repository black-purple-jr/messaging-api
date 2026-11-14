import express from "express";
import authRouter from "@/routes/auth.router.js"
import connectDatabase from "@/config/database.js";
import dotenv from "dotenv";
dotenv.config()

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();


app.use("/auth", authRouter);