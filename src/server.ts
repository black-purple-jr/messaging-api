import express from "express";
import authRouter from "./routes/auth.js"

const app = express();

app.listen(3000);

app.get("/", (req, res) => {
  console.log("test the dummy app")
})

app.get("/auth", authRouter);