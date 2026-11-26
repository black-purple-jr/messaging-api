import * as friendshipRepository from "@/repositories/friendship.js";
import * as friendRequestRepository from "@/repositories/friend-request.js";
import { findById } from "@/repositories/user.js";
import AppError from "@/utils/app-error.js";


export async function sendFriendRequest(userId: string, receiverId: string) {
  if (userId === receiverId) throw new AppError("You cannot send a friend request to yourself", 400);

  const receiver = await findById(receiverId);
  if (!receiver) throw new AppError("User not found", 404);

  const friendship = await friendshipRepository.existsBetween(userId, receiverId);
  if (friendship) throw new AppError("Friendship already exists", 409);


  const existingRequest = await friendRequestRepository.findPendingRequest(userId, receiverId);
  const reverseRequest = await friendRequestRepository.findPendingRequest(receiverId, userId);

  if (existingRequest) throw new AppError("You have already sent a friend request to this user", 409);
  if (reverseRequest) throw new AppError("This user has already sent you a friend request. You can accept their request instead.", 409);
  

  return friendRequestRepository.create(userId, receiverId);
}


export async function getAllReceivedFriendRequests(userId: string) {
  return friendRequestRepository.findAllReceived(userId);
}


export async function getAllSentFriendRequests(userId: string) {
  return friendRequestRepository.findAllSent(userId);
}

