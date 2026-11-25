import * as userRepository from "@/repositories/user.js";
import * as refreshTokenRepository from "@/repositories/refresh-token.js";
import * as userIdentityRepository from "@/repositories/user-identity.js";

import * as pwd from "@/utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/utils/jwt.js";
import { hashToken } from "@/utils/token-hash.js";
import { verifyGoogleToken } from "@/utils/google-auth.js";
import generateUniqueUsername from "@/utils/unique-username.js";
import AppError from "@/utils/app-error.js";
import { isDuplicateKeyError } from "@/utils/database-error.js";



export async function registerUser(email: string, username: string, password: string, displayName: string) {
  // Checking if the user already exists

  const userExists = await userRepository.existsByEmailOrUsername(email, username);

  if (userExists) throw new AppError("User already exists, try logging in", 409);

  // When the email or the username aren't registered, a new user is created

  const passwordHash = await pwd.hashPassword(password);

  let user;

  try {
    user = await userRepository.create({
      username,
      email,
      passwordHash,
      displayName
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError("User already exists, try logging in", 409);
    }

    throw error;
  }


  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
    }

  };
};


export async function loginUser(identifier: string, password: string) {
  // Checking if the user exists or not

  const normalizedIdentifier = identifier.trim();

  const loginIdentifier = normalizedIdentifier.includes("@")
    ? normalizedIdentifier.toLowerCase()
    : normalizedIdentifier;

  const user = await userRepository.findByLoginIdentifier(loginIdentifier);

  if (!user || !user.passwordHash) throw new AppError("Invalid credentials", 401);

  const isPasswordValid = await pwd.verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) throw new AppError("Invalid credentials", 401);

  const accessToken: string = generateAccessToken(user._id.toString());
  const refreshToken: string = generateRefreshToken(user._id.toString());

  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

  await refreshTokenRepository.create({
    userId: user._id.toString(),
    tokenHash,
    expiresAt
  });


  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
    }
  };
};


export async function googleLogin(idToken: string) {
  // 1. Verify Google ID token
  let googleUser;

  try {
    googleUser = await verifyGoogleToken(idToken);
  } catch {
    throw new AppError("Invalid or expired Google ID token.", 401);
  }

  if (!googleUser.email || googleUser.emailVerified !== true) throw new AppError("Google account must have a verified email.", 401);

  // 2. Find existing Google identity
  const identity = await userIdentityRepository.findByProviderAndProviderUserId("google", googleUser.providerUserId);

  let user;

  if (identity) {
    // 3. Retrieve the associated application user
    user = await userRepository.findById(identity.userId.toString());

    if (!user) throw new Error("Google identity references a non-existent user.");
  } else {
    // 4. Check whether the email already belongs to another account
    const email = googleUser.email.toLowerCase().trim();
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) throw new AppError("An account with this email already exists. Sign in using your existing method.", 409);

    // 5. Generate a unique username
    const username = await generateUniqueUsername(email);

    // 6. Create application user
    user = await userRepository.create({
      username: username,
      email: email,
      displayName: googleUser.displayName || username,
      avatar: googleUser.picture || null
    });

    // 7. Link Google identity to application user
    await userIdentityRepository.create({
      userId: user._id.toString(),
      provider: "google",
      providerUserId: googleUser.providerUserId
    });
  }

  // 8. Generate application tokens
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // 9. Store hashed refresh token
  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

  await refreshTokenRepository.create({
    userId: user._id.toString(),
    tokenHash: tokenHash,
    expiresAt: expiresAt
  });

  // 10. Return authentication response
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar
    }
  };
}


export async function refreshUser(refreshToken: string) {
  const userId = verifyRefreshToken(refreshToken);

  const newAccessToken = generateAccessToken(userId);
  const newRefreshToken = generateRefreshToken(userId);

  const oldTokenHash = hashToken(refreshToken);
  const oldToken = await refreshTokenRepository.revokeActiveToken(oldTokenHash, userId);

  if (!oldToken) throw new AppError("Invalid refresh token", 401);

  const newRefreshTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

  await refreshTokenRepository.create({
    userId,
    tokenHash: newRefreshTokenHash,
    expiresAt,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };

}


export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  await refreshTokenRepository.deleteByTokenHash(tokenHash);
}