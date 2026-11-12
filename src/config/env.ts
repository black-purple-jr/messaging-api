import dotenv from "dotenv";
dotenv.config();

const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
const mongoUri = process.env.MONGODB_URI;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined.");
}

export const MONGODB_URI = mongoUri;
export const JWT_SECRET: string = jwtSecret;