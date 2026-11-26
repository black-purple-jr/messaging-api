
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../src/app.js";
import User from "../../../src/models/User.js";
import FriendRequest from "../../../src/models/FriendRequest.js";
import Friendship from "../../../src/models/Friendship.js";

describe("Friend request integration", () => {
  let senderId: string;
  let receiverId: string;
  let senderToken: string;
  let receiverToken: string;

  async function createAuthenticatedUser(
    username: string,
    email: string,
  ) {
    const password = "Password123!";

    await request(app)
      .post("/auth/register")
      .send({
        username,
        email,
        password,
        displayName: username,
      })
      .expect(201);

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        identifier: email,
        password,
      })
      .expect(200);

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User was not created");
    }

    return {
      id: user._id.toString(),
      token: loginResponse.body.accessToken as string,
    };
  }

  beforeEach(async () => {
    const sender = await createAuthenticatedUser(
      "sender",
      "sender@example.com",
    );

    const receiver = await createAuthenticatedUser(
      "receiver",
      "receiver@example.com",
    );

    senderId = sender.id;
    receiverId = receiver.id;
    senderToken = sender.token;
    receiverToken = receiver.token;
  });

  describe("POST /friend-request", () => {
    it("should send a friend request", async () => {
      const response = await request(app)
        .post("/friend-request")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ receiverId })
        .expect(201);

      expect(response.body.message).toBe(
        "Friend request sent successfully",
      );

      expect(response.body.data.senderId).toBe(senderId);
      expect(response.body.data.receiverId).toBe(receiverId);
      expect(response.body.data.status).toBe("pending");

      const savedRequest = await FriendRequest.findOne({
        senderId,
        receiverId,
      });

      expect(savedRequest).not.toBeNull();
      expect(savedRequest?.status).toBe("pending");
    });
  });

  describe("GET /friend-request/sent", () => {
    it("should return the authenticated user's sent requests", async () => {
      await FriendRequest.create({ senderId, receiverId });

      const response = await request(app)
        .get("/friend-request/sent")
        .set("Authorization", `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].senderId).toBe(senderId);
      expect(response.body.data[0].receiverId).toBe(receiverId);
    });
  });

  describe("GET /friend-request/received", () => {
    it("should return the authenticated user's received requests", async () => {
      await FriendRequest.create({ senderId, receiverId });

      const response = await request(app)
        .get("/friend-request/received")
        .set("Authorization", `Bearer ${receiverToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].senderId).toBe(senderId);
      expect(response.body.data[0].receiverId).toBe(receiverId);
    });
  });

  describe("PATCH /friend-request/:requestId/reject", () => {
    it("should reject a received friend request", async () => {
      const friendRequest = await FriendRequest.create({
        senderId,
        receiverId,
      });

      const response = await request(app)
        .patch(`/friend-request/${friendRequest.id}/reject`)
        .set("Authorization", `Bearer ${receiverToken}`)
        .expect(200);

      expect(response.body.message).toBe(
        "Friend request rejected successfully",
      );
      expect(response.body.data.status).toBe("rejected");

      const updatedRequest = await FriendRequest.findById(friendRequest.id);

      expect(updatedRequest?.status).toBe("rejected");
    });
  });

  describe("DELETE /friend-request/:requestId", () => {
    it("should allow the sender to cancel a pending request", async () => {
      const friendRequest = await FriendRequest.create({
        senderId,
        receiverId,
      });

      const response = await request(app)
        .delete(`/friend-request/${friendRequest.id}`)
        .set("Authorization", `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body.message).toBe(
        "Friend request cancelled successfully",
      );

      const deletedRequest = await FriendRequest.findById(friendRequest.id);

      expect(deletedRequest).toBeNull();
    });
  });

  describe("PATCH /friend-request/:requestId/accept", () => {
    it("should accept a received friend request and create a friendship", async () => {
      const friendRequest = await FriendRequest.create({
        senderId,
        receiverId,
      });

      const response = await request(app)
        .patch(`/friend-request/${friendRequest.id}/accept`)
        .set("Authorization", `Bearer ${receiverToken}`)
        .expect(200);

      expect(response.body.message).toBe(
        "Friend request accepted successfully",
      );
      expect(response.body.data.status).toBe("accepted");

      const updatedRequest = await FriendRequest.findById(friendRequest.id);

      expect(updatedRequest?.status).toBe("accepted");

      const friendship = await Friendship.findOne({
        user1Id: senderId,
        user2Id: receiverId,
      });

      expect(friendship).not.toBeNull();
      expect(friendship?.user1Id.toString()).toBe(senderId);
      expect(friendship?.user2Id.toString()).toBe(receiverId);
    });
  });

});
