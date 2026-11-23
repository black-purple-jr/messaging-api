
import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach } from "vitest";
import connectDatabase from "../src/config/database.js";

const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI;

if (!TEST_MONGODB_URI) {
  throw new Error("TEST_MONGODB_URI is not defined.");
}

beforeAll(async () => {
  await connectDatabase(TEST_MONGODB_URI);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
