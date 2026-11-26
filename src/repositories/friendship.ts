import Friendship from "@/models/Friendship.js";
import { type ClientSession } from "mongoose";



export async function create(user1Id: string, user2Id: string, session?: ClientSession) {
  const friendship = new Friendship({ user1Id, user2Id });
  return session
    ? friendship.save({ session })
    : friendship.save();
}

export async function existsBetween(userId: string, otherUserId: string) {
  return Friendship.exists({
    $or: [
      { user1Id: userId, user2Id: otherUserId },
      { user1Id: otherUserId, user2Id: userId },
    ],
  });
}