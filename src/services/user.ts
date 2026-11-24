import * as refreshTokenRepository from "@/repositories/refresh-token.js";
import * as userIdentityRepository from "@/repositories/user-identity.js";
import * as userRepository from "@/repositories/user.js";
import type { UserUpdates } from "@/repositories/user.js";
import AppError from "@/utils/app-error.js";


export async function getProfileData(userId: string) {
  const user = await userRepository.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar
  };
}


export async function updateProfile(userId: string, updates: UserUpdates) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (updates.username && updates.username !== user.username) {
    const existingUser = await userRepository.findByUsername(updates.username);

    if (existingUser) {
      throw new AppError("Username is already taken", 409);
    }
  }

  try {
    const updatedUser = await userRepository.updateById(userId, updates);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar
    };

  } catch (error: unknown) {
    // checking if the username already exists in the MongoDB,
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000 &&
      "keyPattern" in error &&
      error.keyPattern &&
      typeof error.keyPattern === "object" &&
      "username" in error.keyPattern
    ) {
      throw new AppError("Username is already taken", 409);
    }

    throw error;
  }
}



export async function deleteAccount(userId: string) {
  const user = await userRepository.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  await refreshTokenRepository.deleteByUserId(userId);
  await userIdentityRepository.deleteByUserId(userId);

  await userRepository.deleteById(userId);

}