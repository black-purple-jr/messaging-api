import mongoose, { Schema } from "mongoose";


const userSessionSchema = new Schema({
  deviceId: { type: String, unique: true, required: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, { timestamps: true });


const UserSessionModel = mongoose.model("UserSession", userSessionSchema);
export default UserSessionModel;