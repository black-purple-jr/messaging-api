import dotenv from "dotenv";
dotenv.config();


const port = process.env.PORT;

const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const mongoUri = process.env.MONGODB_URI;

const gcpWebClientId = process.env.GOOGLE_CLOUD_WEB_CLIENT_ID;
const gcpAndroidClientId = process.env.GOOGLE_CLOUD_ANDROID_CLIENT_ID;
const gcpIosClientId = process.env.GOOGLE_CLOUD_IOS_CLIENT_ID;



if (!jwtSecret) throw new Error("ACCESS_TOKEN_SECRET is not defined.");
if (!refreshTokenSecret) throw new Error("REFRESH_TOKEN_SECRET is not defined.");

if (!mongoUri) throw new Error("MONGODB_URI is not defined.");

const parsedPort = Number(port);
if (!port) throw new Error("PORT is not defined.");
if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) throw new Error("PORT must be a valid port number.");


if (!gcpWebClientId) throw new Error("GOOGLE_CLOUD_WEB_CLIENT_ID is not defined.");
if (!gcpAndroidClientId) throw new Error("GOOGLE_CLOUD_ANDROID_CLIENT_ID is not defined.");
if (!gcpIosClientId) throw new Error("GOOGLE_CLOUD_IOS_CLIENT_ID is not defined.");



export const PORT = parsedPort;

export const MONGODB_URI = mongoUri;

export const JWT_SECRET: string = jwtSecret;
export const REFRESH_TOKEN_SECRET: string = refreshTokenSecret;

export const GOOGLE_WEB_CLIENT_ID = gcpWebClientId;
export const GOOGLE_ANDROID_CLIENT_ID = gcpAndroidClientId;
export const GOOGLE_IOS_CLIENT_ID = gcpIosClientId;