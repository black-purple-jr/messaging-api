import UserModel from "@/models/User.model.js";
import RefreshTokenModel from "@/models/RefreshToken.model.js";


export async function deleteAccount (userId: string) {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  await RefreshTokenModel.deleteMany({ userId: user._id });

  await UserModel.findByIdAndDelete(user._id);
}