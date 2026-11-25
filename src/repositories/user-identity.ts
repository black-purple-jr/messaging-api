import UserIdentity from "@/models/UserIdentity.js";

export type UserIdentityData = {
  userId: string,
  provider: "google",
  providerUserId: string
}

export function deleteByUserId(userId: string) {
  return UserIdentity.deleteMany({ userId });
}

export function findByProviderAndProviderUserId(provider: "google", providerUserId: string) {
  return UserIdentity.findOne({ provider, providerUserId });
}

export function create(identityData: UserIdentityData) {
  return UserIdentity.create(identityData);
}