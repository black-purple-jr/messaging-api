import UserIdentityModel from "@/models/UserIdentity.js";

export function deleteByUserId(userId: string) {
  return UserIdentityModel.deleteMany({ userId });
}
