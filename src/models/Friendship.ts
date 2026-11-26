import { Schema, model, Types } from "mongoose";

export interface IFriendship {
  user1Id: Types.ObjectId;
  user2Id: Types.ObjectId;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    user1Id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2Id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Friendship = model<IFriendship>("Friendship", friendshipSchema);
export default Friendship;