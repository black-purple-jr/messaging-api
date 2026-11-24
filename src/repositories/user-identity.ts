import UserIdentityModel from "@/models/UserIdentity.js";

export type UserIdentityData = { 
  userId: string,
  provider: "google",
  providerUserId: string
 }

export function deleteByUserId(userId: string) {
  return UserIdentityModel.deleteMany({ userId });
}

export function findByProviderAndProviderUserId(provider: "google", providerUserId: string) {
  return UserIdentityModel.findOne({ provider, providerUserId });
}

export function create(identityData: UserIdentityData) {
  return UserIdentityModel.create(identityData);
}