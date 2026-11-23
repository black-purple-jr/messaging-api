import mongoose from "mongoose";
import { MONGODB_URI } from "./env.js";


export default async function connectDatabase(uri: string = MONGODB_URI): Promise<void> {
  await mongoose.connect(uri);
  console.log("MongoDB connected successfully");
}