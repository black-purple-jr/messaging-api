
import type { Request, Response, NextFunction } from "express";

import * as friendRequestService from "@/services/friend-request.js";
import AppError from "@/utils/app-error.js";


export async function sendFriendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { receiverId } = req.body;

    const friendRequest = await friendRequestService.sendFriendRequest(
      userId,
      receiverId
    );

    res.status(201).json({
      message: "Friend request sent successfully",
      data: friendRequest,
    });
  } catch (error) {
    next(error);
  }
}


export async function getAllSentFriendRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const friendRequests =
      await friendRequestService.getAllSentFriendRequests(userId);

    res.status(200).json({
      data: friendRequests,
    });
  } catch (error) {
    next(error);
  }
}


export async function getAllReceivedFriendRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const friendRequests =
      await friendRequestService.getAllReceivedFriendRequests(userId);

    res.status(200).json({
      data: friendRequests,
    });
  } catch (error) {
    next(error);
  }
}


export async function acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;

    if (typeof requestId !== "string") {
      throw new AppError("Invalid friend request ID", 400);
    }

    const friendRequest = await friendRequestService.acceptFriendRequest(userId,requestId);

    res.status(200).json({
      message: "Friend request accepted successfully",
      data: friendRequest,
    });
  } catch (error) {
    next(error);
  }
}


export async function rejectFriendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;

    if (typeof requestId !== "string") {
      throw new AppError("Invalid friend request ID", 400);
    }

    const friendRequest = await friendRequestService.rejectFriendRequest(userId, requestId);

    res.status(200).json({
      message: "Friend request rejected successfully",
      data: friendRequest,
    });
  } catch (error) {
    next(error);
  }
}


export async function deleteFriendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;

    if (typeof requestId !== "string") {
      throw new AppError("Invalid friend request ID", 400);
    }

    const friendRequest = await friendRequestService.deleteFriendRequest(userId, requestId);

    res.status(200).json({
      message: "Friend request cancelled successfully",
      data: friendRequest,
    });
  } catch (error) {
    next(error);
  }
}
