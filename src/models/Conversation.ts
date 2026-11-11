import { Types } from "mongoose";

export default class Conversation {
  id: Types.ObjectId;
  firstUserId: Types.ObjectId;
  secondUserId: Types.ObjectId;
  startedAt: Date;

  constructor (firstUserId: Types.ObjectId, secondUserId: Types.ObjectId) {
    this.id = new Types.ObjectId();
    this.firstUserId = firstUserId;
    this.secondUserId = secondUserId;
    this.startedAt = new Date();
  }

}