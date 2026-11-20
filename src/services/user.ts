import UserModel from "@/models/User.js";
import RefreshTokenModel from "@/models/RefreshToken.js";
import UserIdentityModel from "@/models/UserIdentity.js";
import AppError from "@/utils/app-error.js";


export async function getProfileData(userId: string) {
  const user = await UserModel.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  return user.toJSON()
}


export async function updateProfile(userId: string, updates: { displayName?: string; picture?: string | null; }) {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updates },
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    id: user.id,
    username: user.username,
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