import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema({
  firstUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  secondUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" }
}, { timestamps: true });

const ConversationModel = mongoose.model("Conversation", conversationSchema);
export default ConversationModel;