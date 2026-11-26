import mongoose from "mongoose";

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


export async function acceptFriendRequest(userId: string, requestId: string) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const request = await friendRequestRepository.findById(requestId);

    if (!request) {
      throw new AppError("Friend request not found", 404);
    }

    if (request.receiverId.toString() !== userId) {
      throw new AppError("You are not authorized to accept this request", 403);
    }

    if (request.status !== "pending") {
      throw new AppError("This friend request is no longer pending", 409);
    }

    const acceptedRequest =
      await friendRequestRepository.acceptPendingRequest(
        requestId,
        userId,
        session
      );

    if (!acceptedRequest) {
      throw new AppError("This friend request is no longer pending", 409);
    }

    await friendshipRepository.create(
      request.senderId.toString(),
      request.receiverId.toString(),
      session
    );

    await session.commitTransaction();

    return acceptedRequest;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
}


export async function rejectFriendRequest(userId: string, requestId: string) {
  const request = await friendRequestRepository.findById(requestId);

  if (!request) {
    throw new AppError("Friend request not found", 404);
  }

  if (request.receiverId.toString() !== userId) {
    throw new AppError(
      "You are not authorized to reject this request",
      403
    );
  }

  if (request.status !== "pending") {
    throw new AppError("This friend request is no longer pending", 409);
  }

  const rejectedRequest =
    await friendRequestRepository.rejectPendingRequest(requestId, userId);

  if (!rejectedRequest) {
    throw new AppError("This friend request is no longer pending", 409);
  }

  return rejectedRequest;
}


export async function deleteFriendRequest(userId: string, requestId: string) {
  const request = await friendRequestRepository.findById(requestId);

  if (!request) {
    throw new AppError("Friend request not found", 404);
  }

  if (request.senderId.toString() !== userId) {
    throw new AppError(
      "You are not authorized to delete this request",
      403
    );
  }

  if (request.status !== "pending") {
    throw new AppError("Only pending friend requests can be deleted", 409);
  }

  const deletedRequest =
    await friendRequestRepository.deletePendingRequest(requestId, userId);

  if (!deletedRequest) {
    throw new AppError("This friend request is no longer pending", 409);
  }

  return deletedRequest;
}