import UserModel from "@/models/User.js";
import RefreshTokenModel from "@/models/RefreshToken.js";
import UserIdentityModel from "@/models/UserIdentity.js";
import AppError from "@/utils/app-error.js";


export async function getProfileData(userId: string) {
  const user = await UserModel.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar
  };
}


export async function updateProfile(userId: string, updates: { username?: string; displayName?: string; avatar?: string | null; }) {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (updates.username && updates.username !== user.username) {
    const existingUser = await UserModel.findOne({
      username: updates.username
    });

    if (existingUser) {
      throw new AppError("Username is already taken", 409);
    }
  }

  Object.assign(user, updates);

  try {
    await user.save();
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

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar
  };
}



export async function deleteAccount(userId: string) {
  const user = await UserModel.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  await RefreshTokenModel.deleteMany({ userId: user._id });
  await UserIdentityModel.deleteMany({ userId: user._id });

  await user.deleteOne();
}