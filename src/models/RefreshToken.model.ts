import mongoose, { Schema } from "mongoose";


const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null }
});


refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);


const RefreshTokenModel = mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshTokenModel;