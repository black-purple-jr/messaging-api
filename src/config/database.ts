import mongoose from "mongoose";
import { MONGODB_URI } from "./env.js";

export default async function connectDatabase (): Promise<void> {
  try{
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);

  }
}