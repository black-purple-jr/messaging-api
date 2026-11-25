import mongoose, { Schema } from "mongoose";

type AuthProvider = "google" | "apple" | "microsoft";

const userIdentitySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  provider: {
    type: String,
    enum: ["google", "apple", "microsoft"] satisfies AuthProvider[],
    required: true
  },
  providerUserId: { type: String, required: true }
});

userIdentitySchema.index(
  { provider: 1, providerUserId: 1 },
  { unique: true }
);


const UserIdentity = mongoose.model("UserIdentity", userIdentitySchema);
export default UserIdentity;