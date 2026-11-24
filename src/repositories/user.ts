import UserModel from "@/models/User.js";

export type UserUpdates = {
  username?: string;
  displayName?: string;
  avatar?: string | null;
};

export function findById(userId: string) {
  return UserModel.findById(userId);
}

export function findByUsername(username: string) {
  return UserModel.findOne({ username });
}

export function updateById(userId: string, updates: UserUpdates) {
  return UserModel.findByIdAndUpdate(
    userId,
    { $set: updates },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
}

export function deleteById(userId: string) {
  return UserModel.findByIdAndDelete(userId);
}