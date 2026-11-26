
import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

import * as userRepository from "@/repositories/user.js";
import * as friendshipRepository from "@/repositories/friendship.js";
import * as friendRequestRepository from "@/repositories/friend-request.js";

import {
  sendFriendRequest,
  getAllSentFriendRequests,
  getAllReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriendRequest,
} from "@/services/friend-request.js";

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock("@/repositories/user.js", () => ({
  findById: vi.fn(),
}));

vi.mock("@/repositories/friendship.js", () => ({
  existsBetween: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/repositories/friend-request.js", () => ({
  create: vi.fn(),
  findPendingRequest: vi.fn(),
  findById: vi.fn(),
  findAllReceived: vi.fn(),
  findAllSent: vi.fn(),
  acceptPendingRequest: vi.fn(),
  rejectPendingRequest: vi.fn(),
  deletePendingRequest: vi.fn(),
}));

vi.mock("mongoose", () => ({
  default: {
    startSession: vi.fn(),
  },
}));

// -----------------------------------------------------------------------------
// Test data
// -----------------------------------------------------------------------------

const senderId = "691234567890123456789012";
const receiverId = "691234567890123456789013";
const requestId = "691234567890123456789014";

const mockReceiver = {
  _id: receiverId,
  username: "receiver",
};

const mockFriendRequest = {
  _id: requestId,
  senderId,
  receiverId,
  status: "pending",
};

const mockAcceptedRequest = {
  ...mockFriendRequest,
  status: "accepted",
};

const mockRejectedRequest = {
  ...mockFriendRequest,
  status: "rejected",
};

const mockSentRequests = [mockFriendRequest];
const mockReceivedRequests = [mockFriendRequest];

// -----------------------------------------------------------------------------
// MongoDB transaction mock
// -----------------------------------------------------------------------------

const mockSession = {
  startTransaction: vi.fn(),
  inTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn(),
};

function setupSessionMock() {
  vi.mocked(mongoose.startSession).mockResolvedValue(mockSession as never);
  mockSession.inTransaction.mockReturnValue(true);
}

// -----------------------------------------------------------------------------
// Shared setup
// -----------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(userRepository.findById).mockResolvedValue(
    mockReceiver as never,
  );

  vi.mocked(friendshipRepository.existsBetween).mockResolvedValue(
    null as never,
  );

  vi.mocked(friendshipRepository.create).mockResolvedValue(
    {} as never,
  );

  vi.mocked(friendRequestRepository.create).mockResolvedValue(
    mockFriendRequest as never,
  );

  vi.mocked(friendRequestRepository.findPendingRequest).mockResolvedValue(
    null as never,
  );

  vi.mocked(friendRequestRepository.findById).mockResolvedValue(
    mockFriendRequest as never,
  );

  vi.mocked(friendRequestRepository.findAllSent).mockResolvedValue(
    mockSentRequests as never,
  );

  vi.mocked(friendRequestRepository.findAllReceived).mockResolvedValue(
    mockReceivedRequests as never,
  );

  vi.mocked(friendRequestRepository.acceptPendingRequest).mockResolvedValue(
    mockAcceptedRequest as never,
  );

  vi.mocked(friendRequestRepository.rejectPendingRequest).mockResolvedValue(
    mockRejectedRequest as never,
  );

  vi.mocked(friendRequestRepository.deletePendingRequest).mockResolvedValue(
    mockFriendRequest as never,
  );

  setupSessionMock();
});

// =============================================================================
// sendFriendRequest()
// =============================================================================

describe("sendFriendRequest()", () => {
  it("should send a friend request successfully", async () => {
    const result = await sendFriendRequest(senderId, receiverId);

    expect(userRepository.findById).toHaveBeenCalledWith(receiverId);

    expect(friendshipRepository.existsBetween).toHaveBeenCalledWith(
      senderId,
      receiverId,
    );

    expect(friendRequestRepository.findPendingRequest).toHaveBeenNthCalledWith(
      1,
      senderId,
      receiverId,
    );

    expect(friendRequestRepository.findPendingRequest).toHaveBeenNthCalledWith(
      2,
      receiverId,
      senderId,
    );

    expect(friendRequestRepository.create).toHaveBeenCalledWith(
      senderId,
      receiverId,
    );

    expect(result).toEqual(mockFriendRequest);
  });

  it("should reject sending a friend request to yourself", async () => {
    await expect(
      sendFriendRequest(senderId, senderId),
    ).rejects.toMatchObject({
      message: "You cannot send a friend request to yourself",
      statusCode: 400,
    });

    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(friendshipRepository.existsBetween).not.toHaveBeenCalled();
    expect(friendRequestRepository.create).not.toHaveBeenCalled();
  });

  it("should reject a request if the receiver does not exist", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(
      sendFriendRequest(senderId, receiverId),
    ).rejects.toMatchObject({
      message: "User not found",
      statusCode: 404,
    });

    expect(friendshipRepository.existsBetween).not.toHaveBeenCalled();
    expect(friendRequestRepository.create).not.toHaveBeenCalled();
  });

  it("should reject a request if a friendship already exists", async () => {
    vi.mocked(friendshipRepository.existsBetween).mockResolvedValue(
      { _id: "existing-friendship" } as never,
    );

    await expect(
      sendFriendRequest(senderId, receiverId),
    ).rejects.toMatchObject({
      message: "Friendship already exists",
      statusCode: 409,
    });

    expect(friendRequestRepository.findPendingRequest).not.toHaveBeenCalled();
    expect(friendRequestRepository.create).not.toHaveBeenCalled();
  });

  it("should reject a duplicate outgoing pending request", async () => {
    vi.mocked(friendRequestRepository.findPendingRequest).mockResolvedValueOnce(
      mockFriendRequest as never,
    );

    await expect(
      sendFriendRequest(senderId, receiverId),
    ).rejects.toMatchObject({
      message: "You have already sent a friend request to this user",
      statusCode: 409,
    });

    expect(friendRequestRepository.create).not.toHaveBeenCalled();
  });

  it("should reject a request if the receiver already sent a pending request", async () => {
    vi.mocked(friendRequestRepository.findPendingRequest)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(mockFriendRequest as never);

    await expect(
      sendFriendRequest(senderId, receiverId),
    ).rejects.toMatchObject({
      message:
        "This user has already sent you a friend request. You can accept their request instead.",
      statusCode: 409,
    });

    expect(friendRequestRepository.create).not.toHaveBeenCalled();
  });
});

// =============================================================================
// getAllSentFriendRequests()
// =============================================================================

describe("getAllSentFriendRequests()", () => {
  it("should return all sent friend requests", async () => {
    const result = await getAllSentFriendRequests(senderId);

    expect(friendRequestRepository.findAllSent).toHaveBeenCalledWith(
      senderId,
    );

    expect(result).toEqual(mockSentRequests);
  });
});

// =============================================================================
// getAllReceivedFriendRequests()
// =============================================================================

describe("getAllReceivedFriendRequests()", () => {
  it("should return all received friend requests", async () => {
    const result = await getAllReceivedFriendRequests(receiverId);

    expect(friendRequestRepository.findAllReceived).toHaveBeenCalledWith(
      receiverId,
    );

    expect(result).toEqual(mockReceivedRequests);
  });
});

// =============================================================================
// acceptFriendRequest()
// =============================================================================

describe("acceptFriendRequest()", () => {
  it("should accept a friend request and create a friendship", async () => {
    const result = await acceptFriendRequest(receiverId, requestId);

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();

    expect(friendRequestRepository.findById).toHaveBeenCalledWith(
      requestId,
    );

    expect(
      friendRequestRepository.acceptPendingRequest,
    ).toHaveBeenCalledWith(requestId, receiverId, mockSession);

    expect(friendshipRepository.create).toHaveBeenCalledWith(
      senderId,
      receiverId,
      mockSession,
    );

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.abortTransaction).not.toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();

    expect(result).toEqual(mockAcceptedRequest);
  });

  it("should reject accepting a request that does not exist", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue(null);

    await expect(
      acceptFriendRequest(receiverId, requestId),
    ).rejects.toMatchObject({
      message: "Friend request not found",
      statusCode: 404,
    });

    expect(friendRequestRepository.acceptPendingRequest).not.toHaveBeenCalled();
    expect(friendshipRepository.create).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it("should reject accepting a request as someone other than the receiver", async () => {
    await expect(
      acceptFriendRequest(senderId, requestId),
    ).rejects.toMatchObject({
      message: "You are not authorized to accept this request",
      statusCode: 403,
    });

    expect(friendRequestRepository.acceptPendingRequest).not.toHaveBeenCalled();
    expect(friendshipRepository.create).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it("should reject accepting a request that is no longer pending", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue({
      ...mockFriendRequest,
      status: "rejected",
    } as never);

    await expect(
      acceptFriendRequest(receiverId, requestId),
    ).rejects.toMatchObject({
      message: "This friend request is no longer pending",
      statusCode: 409,
    });

    expect(friendRequestRepository.acceptPendingRequest).not.toHaveBeenCalled();
    expect(friendshipRepository.create).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it("should reject if the request was processed concurrently", async () => {
    vi.mocked(
      friendRequestRepository.acceptPendingRequest,
    ).mockResolvedValue(null);

    await expect(
      acceptFriendRequest(receiverId, requestId),
    ).rejects.toMatchObject({
      message: "This friend request is no longer pending",
      statusCode: 409,
    });

    expect(friendshipRepository.create).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it("should abort the transaction if creating the friendship fails", async () => {
    vi.mocked(friendshipRepository.create).mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      acceptFriendRequest(receiverId, requestId),
    ).rejects.toThrow("Database error");

    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });
});

// =============================================================================
// rejectFriendRequest()
// =============================================================================

describe("rejectFriendRequest()", () => {
  it("should reject a friend request successfully", async () => {
    const result = await rejectFriendRequest(receiverId, requestId);

    expect(friendRequestRepository.findById).toHaveBeenCalledWith(
      requestId,
    );

    expect(
      friendRequestRepository.rejectPendingRequest,
    ).toHaveBeenCalledWith(requestId, receiverId);

    expect(result).toEqual(mockRejectedRequest);
  });

  it("should reject if the friend request does not exist", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue(null);

    await expect(
      rejectFriendRequest(receiverId, requestId),
    ).rejects.toMatchObject({
      message: "Friend request not found",
      statusCode: 404,
    });

    expect(
      friendRequestRepository.rejectPendingRequest,
    ).not.toHaveBeenCalled();
  });

  it("should reject if someone other than the receiver tries to reject the request", async () => {
    await expect(
      rejectFriendRequest(senderId, requestId),
    ).rejects.toMatchObject({
      message: "You are not authorized to reject this request",
      statusCode: 403,
    });

    expect(
      friendRequestRepository.rejectPendingRequest,
    ).not.toHaveBeenCalled();
  });

  it("should reject a request that is no longer pending", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue({
      ...mockFriendRequest,
      status: "accepted",
    } as never);

    await expect(
      rejectFriendRequest(receiverId, requestId),
    ).rejects.toMatchObject({
      message: "This friend request is no longer pending",
      statusCode: 409,
    });

    expect(
      friendRequestRepository.rejectPendingRequest,
    ).not.toHaveBeenCalled();
  });

  it("should reject if the request was processed concurrently", async () => {
    vi.mocked(
      friendRequestRepository.rejectPendingRequest,
    ).mockResolvedValue(null);

    await expect(
      rejectFriendRequest(receiverId, requestId),
    ).rejects.toMatchObject({
      message: "This friend request is no longer pending",
      statusCode: 409,
    });
  });
});

// =============================================================================
// deleteFriendRequest()
// =============================================================================

describe("deleteFriendRequest()", () => {
  it("should delete a sent friend request successfully", async () => {
    const result = await deleteFriendRequest(senderId, requestId);

    expect(friendRequestRepository.findById).toHaveBeenCalledWith(
      requestId,
    );

    expect(
      friendRequestRepository.deletePendingRequest,
    ).toHaveBeenCalledWith(requestId, senderId);

    expect(result).toEqual(mockFriendRequest);
  });

  it("should reject if the friend request does not exist", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue(null);

    await expect(
      deleteFriendRequest(senderId, requestId),
    ).rejects.toMatchObject({
      message: "Friend request not found",
      statusCode: 404,
    });

    expect(
      friendRequestRepository.deletePendingRequest,
    ).not.toHaveBeenCalled();
  });

  it("should reject if someone other than the sender tries to delete the request", async () => {
    await expect(
      deleteFriendRequest(receiverId, requestId),
    ).rejects.toMatchObject({
      message: "You are not authorized to delete this request",
      statusCode: 403,
    });

    expect(
      friendRequestRepository.deletePendingRequest,
    ).not.toHaveBeenCalled();
  });

  it("should reject deleting a request that is no longer pending", async () => {
    vi.mocked(friendRequestRepository.findById).mockResolvedValue({
      ...mockFriendRequest,
      status: "accepted",
    } as never);

    await expect(
      deleteFriendRequest(senderId, requestId),
    ).rejects.toMatchObject({
      message: "Only pending friend requests can be deleted",
      statusCode: 409,
    });

    expect(
      friendRequestRepository.deletePendingRequest,
    ).not.toHaveBeenCalled();
  });

  it("should reject if the request was processed concurrently", async () => {
    vi.mocked(
      friendRequestRepository.deletePendingRequest,
    ).mockResolvedValue(null);

    await expect(
      deleteFriendRequest(senderId, requestId),
    ).rejects.toMatchObject({
      message: "This friend request is no longer pending",
      statusCode: 409,
    });
  });
});
