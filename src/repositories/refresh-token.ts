import RefreshToken from "@/models/RefreshToken.js";

export type RefreshTokenCreationData = {
  userId: string,
  tokenHash: string,
  expiresAt: Date
}

export function deleteByUserId(userId: string) {
  return RefreshToken.deleteMany({ userId });
}

export function create(data: RefreshTokenCreationData) {
  return RefreshToken.create(data);
}

export function revokeActiveToken(oldTokenHash: string, userId: string) {
  return RefreshToken.findOneAndUpdate({
    tokenHash: oldTokenHash,
    userId: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  },
    { $set: { revokedAt: new Date() } },
    { returnDocument: "before" }
  );
}

export function deleteByTokenHash(tokenHash: string) {
  return RefreshToken.deleteOne({
    tokenHash,
    expiresAt: { $gt: new Date() }
  });
}