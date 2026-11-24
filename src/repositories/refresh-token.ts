import RefreshTokenModel from "@/models/RefreshToken.js";

export function deleteByUserId(userId: string) {
  return RefreshTokenModel.deleteMany({ userId });
}
