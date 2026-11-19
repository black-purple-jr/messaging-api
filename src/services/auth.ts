import UserModel from "@/models/User.js";
import * as pwd from "@/utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/utils/jwt.js";
import { hashToken } from "@/utils/token-hash.js";
import RefreshTokenModel from "@/models/RefreshToken.js";
import { verifyGoogleToken } from "@/utils/google-auth.js";
import UserIdentityModel from "@/models/UserIdentity.js";
import generateUniqueUsername from "@/utils/unique-username.js";



export async function registerUser(email: string, username: string, password: string, displayName: string) {
  // Checking if the user already exists

  const userExists = await UserModel.exists({
    $or: [
      { email },
      { username }
    ]
  });

  if (userExists) throw new Error("User already exists, try logging in");

  // When the email or the username aren't registered, a new user is created

  const passwordHash = await pwd.hashPassword(password);

  const user = await UserModel.create({
    username,
    email,
    passwordHash,
    displayName
  });


  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
    }

  }
};


export async function loginUser(identifier: string, password: string) {
  // Checking if the user exists or not

  const user = await UserModel.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).select("+passwordHash");

  if (!user || !user.passwordHash) throw new Error("Invalid credentials");

  const isPasswordValid = await pwd.verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) throw new Error("Invalid credentials");

  const accessToken: string = generateAccessToken(user._id.toString());
  const refreshToken: string = generateRefreshToken(user._id.toString());

  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.create({
    userId: user._id,
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
  }
};


export async function googleLogin(idToken: string) {
  // 1. Verify Google ID token
  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.email || googleUser.emailVerified !== true) throw new Error("Google account must have a verified email.");

  // 2. Find existing Google identity
  let identity = await UserIdentityModel.findOne({
    provider: "google",
    providerUserId: googleUser.providerUserId
  });

  let user;

  if (identity) {
    // 3. Retrieve the associated application user
    user = await UserModel.findById(identity.userId);

    if (!user) throw new Error("Associated user account not found.");
  } else {
    // 4. Check whether the email already belongs to another account
    const email = googleUser.email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: email });

    if (existingUser) throw new Error("An account with this email already exists. Sign in using your existing method.");

    // 5. Generate a unique username
    const username = await generateUniqueUsername(email);

    // 6. Create application user
    user = await UserModel.create({
      username: username,
      email: email,
      displayName: googleUser.displayName || username,
      avatar: googleUser.picture || null
    });

    // 7. Link Google identity to application user
    identity = await UserIdentityModel.create({
      userId: user._id,
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

  await RefreshTokenModel.create({
    userId: user._id,
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
  const oldToken = await RefreshTokenModel.findOneAndUpdate({
    tokenHash: oldTokenHash,
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  },
    { $set: { revokedAt: new Date() } },
    { new: false }
  );

  if (!oldToken) throw new Error("Invalid refresh token");

  const newRefreshTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.create({
    userId,
    tokenHash: newRefreshTokenHash,
    expiresAt,
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  }

}


export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  await RefreshTokenModel.deleteOne({
    tokenHash,
    expiresAt: { $gt: new Date() }
  });
}