import mongoose from "mongoose";
import { MONGODB_URI } from "./env.js";


export default async function connectDatabase(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected successfully");
}