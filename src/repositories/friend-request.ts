import { type ClientSession } from "mongoose";
import FriendRequest from "@/models/FriendRequest.js";

export async function create(senderId: string, receiverId: string) {
  return FriendRequest.create({ senderId, receiverId });
}

export async function findPendingRequest(senderId: string, receiverId: string) {
  return FriendRequest.findOne({
    senderId,
    receiverId,
    status: "pending",
  });
}

export async function findById(requestId: string) {
  return FriendRequest.findById(requestId);
}

export async function findAllReceived(userId: string) {
  return FriendRequest.find({ receiverId: userId }).sort({ createdAt: -1 });
}

export async function findAllSent(userId: string) {
  return FriendRequest.find({ senderId: userId }).sort({ createdAt: -1 });
}

export async function updateStatus(requestId: string, status: "accepted" | "rejected") {
  return FriendRequest.findByIdAndUpdate(
    requestId,
    { status },
    { new: true, runValidators: true }
  );
}

export async function deleteById(requestId: string) {
  return FriendRequest.findByIdAndDelete(requestId);
}


export async function acceptPendingRequest(requestId: string, receiverId: string, session?: ClientSession) {
  return FriendRequest.findOneAndUpdate(
    {
      _id: requestId,
      receiverId,
      status: "pending",
    },
    { status: "accepted" },
    {
      new: true,
      runValidators: true,
      ...(session ? { session } : {}),
    }
  );
}


export async function rejectPendingRequest(requestId: string, receiverId: string) {
  return FriendRequest.findOneAndUpdate(
    {
      _id: requestId,
      receiverId,
      status: "pending",
    },
    { status: "rejected" },
    {
      new: true,
      runValidators: true,
    }
  );
}


export async function deletePendingRequest(requestId: string,senderId: string) {
  return FriendRequest.findOneAndDelete({
    _id: requestId,
    senderId,
    status: "pending",
  });
}