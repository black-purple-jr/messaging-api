import UserModel from "@/models/User.js";

export type UserUpdates = {
  username?: string;
  displayName?: string;
  avatar?: string | null;
};

export type UserCreationData = {
  username: string;
  email: string;
  passwordHash?: string;
  displayName: string;
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

export function existsByEmailOrUsername(email: string, username: string) {
  return UserModel.exists({
    $or: [
      { email },
      { username }
    ]
  });

}

export function findByLoginIdentifier(identifier: string) {
  return UserModel.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).select("+passwordHash");
}

export function findByEmail(email: string) {
  return UserModel.findOne({ email });
}

export function create(user: UserCreationData) {
  return UserModel.create(user);
}