import Friendship from "@/models/Friendship.js";

export async function existsBetween(userId: string, otherUserId: string) {
  return Friendship.exists({
    $or: [
      { user1Id: userId, user2Id: otherUserId },
      { user1Id: otherUserId, user2Id: userId },
    ],
  });
}