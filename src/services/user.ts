import UserModel from "@/models/User.js";
import RefreshTokenModel from "@/models/RefreshToken.js";
import UserIdentityModel from "@/models/UserIdentity.js";


export async function deleteAccount(userId: string) {
  const user = await UserModel.findById(userId);

  if (!user) throw new Error("User not found");

  await RefreshTokenModel.deleteMany({ userId: user._id });
  await UserIdentityModel.deleteMany({ userId: user._id });

  await user.deleteOne();
}