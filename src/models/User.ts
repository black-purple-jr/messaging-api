import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, default: null, select: false },
  displayName: { type: String, required: true, trim: true },
  avatar: { type: String, default: null }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;