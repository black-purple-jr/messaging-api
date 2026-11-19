import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  conversationId: { type: Schema.Types.ObjectId, required: true, ref: "Conversation" },
  text: { type: String, required: true, trim: true }
}, { timestamps: true });

const MessageModel = mongoose.model("Message", messageSchema);
export default MessageModel;