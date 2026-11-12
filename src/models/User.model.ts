import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  displayName: { type: String, required: true, trim: true }
}, { timestamps: true });

const UserModel = mongoose.model("User", userSchema);
export default UserModel;