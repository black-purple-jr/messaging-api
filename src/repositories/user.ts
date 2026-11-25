import User from "@/models/User.js";

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
  return User.findById(userId);
}

export function findByUsername(username: string) {
  return User.findOne({ username });
}

export function updateById(userId: string, updates: UserUpdates) {
  return User.findByIdAndUpdate(
    userId,
    { $set: updates },
    {
      returnDocument: "after",
      runValidators: true
    }
  );
}

export function deleteById(userId: string) {
  return User.findByIdAndDelete(userId);
}

export function existsByEmailOrUsername(email: string, username: string) {
  return User.exists({
    $or: [
      { email },
      { username }
    ]
  });

}

export function findByLoginIdentifier(identifier: string) {
  return User.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).select("+passwordHash");
}

export function findByEmail(email: string) {
  return User.findOne({ email });
}

export function create(user: UserCreationData) {
  return User.create(user);
}