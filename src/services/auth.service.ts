import UserModel from "@/models/User.model.js";
import * as pwd from "@/utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/utils/jwt.js";
import { hashToken } from "@/utils/token-hash.js";
import RefreshTokenModel from "@/models/RefreshToken.model.js";



export async function registerUser(email: string, username: string, password: string, displayName: string) {
  // Cheking if the user already exists

  const userExists = await UserModel.exists({
    $or: [
      { email },
      { username }
    ]
  });

  if (userExists) throw new Error("User already exists, try loging in");

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
  // Cheking if the user exists or not

  const user = await UserModel.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).select("+passwordHash");

  if (!user) throw new Error("Invalid credentials");

  const isPasswordValid = await pwd.verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) throw new Error("Invalid credentials");

  const accessToken: string = generateAccessToken(user._id.toString());
  const refreshToken: string = generateRefreshToken(user._id.toString());

  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

  if (!oldToken) {
    throw new Error("Invalid refresh token");
  }

  const newRefreshTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

  await RefreshTokenModel.findOneAndUpdate({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }, { $set: { revokedAt: new Date() } })

}