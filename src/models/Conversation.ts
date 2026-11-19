import mongoose, { Schema } from "mongoose";



type ConversationType = "direct" | "group";

const conversationSchema = new Schema({
  type: {
    type: String,
    enum: ["direct", "group"] satisfies ConversationType[],
    required: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  name: {
    type: String,
    trim: true,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });



const ConversationModel = mongoose.model("Conversation", conversationSchema);
export default ConversationModel;