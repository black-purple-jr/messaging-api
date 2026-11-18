import { OAuth2Client } from "google-auth-library";
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from "@/config/env.js";


const googleClient = new OAuth2Client();

const allowedAudiences = [
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID
];

export async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken: idToken,
    audience: allowedAudiences
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.sub) {
    throw new Error("Invalid Google ID token.");
  }

  return {
    providerUserId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    displayName: payload.name,
    picture: payload.picture
  };
}