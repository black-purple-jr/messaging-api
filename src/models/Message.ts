import { Types } from "mongoose";

export default class Message {
  id: Types.ObjectId;
  senderId: Types.ObjectId;
  conversationId: Types.ObjectId;
  text: string;
  sentAt: Date;
  editedAt?: Date;

  constructor (text: string, senderId: Types.ObjectId, conversationId: Types.ObjectId) {
    this.id = new Types.ObjectId();
    this.senderId = senderId;
    this.conversationId = conversationId;
    this.text = text;
    this.sentAt = new Date();
  }
}