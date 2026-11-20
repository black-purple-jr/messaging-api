import app from "@/app.js";
import connectDatabase from "@/config/database.js";
import startServer from "./startup/start-server.js";
import { PORT } from "@/config/env.js";

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});