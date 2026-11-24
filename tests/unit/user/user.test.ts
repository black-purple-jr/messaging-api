
import { describe, it, expect, vi, beforeEach } from "vitest";

import * as userRepository from "@/repositories/user.js";
import * as refreshTokenRepository from "@/repositories/refresh-token.js";
import * as userIdentityRepository from "@/repositories/user-identity.js";

import {
  getProfileData,
  updateProfile,
  deleteAccount
} from "@/services/user.js";

vi.mock("@/repositories/user.js", () => ({
  findById: vi.fn(),
  findByUsername: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn()
}));

vi.mock("@/repositories/refresh-token.js", () => ({
  deleteByUserId: vi.fn()
}));

vi.mock("@/repositories/user-identity.js", () => ({
  deleteByUserId: vi.fn()
}));

describe("User service", () => {
  const userId = "691234567890123456789012";

  const mockUser = {
    _id: userId,
    id: userId,
    username: "testuser",
    email: "test@example.com",
    displayName: "Test User",
    avatar: null
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getProfileData", () => {
    it("should return the user's profile", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as never);

      const result = await getProfileData(userId);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);

      expect(result).toEqual({
        id: userId,
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User",
        avatar: null
      });
    });

    it("should throw a 404 error when the user does not exist", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(getProfileData(userId)).rejects.toMatchObject({
        statusCode: 404
      });
    });
  });

  describe("updateProfile", () => {
    it("should update the user's profile", async () => {
      const updatedUser = {
        ...mockUser,
        displayName: "Updated Name"
      };

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as never);
      vi.mocked(userRepository.updateById).mockResolvedValue(updatedUser as never);

      const result = await updateProfile(userId, {
        displayName: "Updated Name"
      });

      expect(userRepository.updateById).toHaveBeenCalledWith(userId, {
        displayName: "Updated Name"
      });

      expect(result.displayName).toBe("Updated Name");
    });

    it("should throw a 404 error when the user does not exist", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(
        updateProfile(userId, { displayName: "Updated Name" })
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(userRepository.updateById).not.toHaveBeenCalled();
    });

    it("should throw a 409 error when the username is already taken", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as never);
      vi.mocked(userRepository.findByUsername).mockResolvedValue({
        _id: "another-user"
      } as never);

      await expect(
        updateProfile(userId, { username: "takenname" })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(userRepository.updateById).not.toHaveBeenCalled();
    });

    it("should convert a duplicate username database error into a 409 error", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as never);
      vi.mocked(userRepository.findByUsername).mockResolvedValue(null);

      vi.mocked(userRepository.updateById).mockRejectedValue({
        code: 11000,
        keyPattern: { username: 1 }
      });

      await expect(
        updateProfile(userId, { username: "newname" })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("should propagate unexpected database errors", async () => {
      const databaseError = new Error("Database connection failed");

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as never);
      vi.mocked(userRepository.updateById).mockRejectedValue(databaseError);

      await expect(
        updateProfile(userId, { displayName: "Updated Name" })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("deleteAccount", () => {
    it("should delete the user's refresh tokens, identities, and account", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as never);

      vi.mocked(refreshTokenRepository.deleteByUserId).mockResolvedValue({} as never);
      vi.mocked(userIdentityRepository.deleteByUserId).mockResolvedValue({} as never);
      vi.mocked(userRepository.deleteById).mockResolvedValue(mockUser as never);

      await deleteAccount(userId);

      expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(userId);
      expect(userIdentityRepository.deleteByUserId).toHaveBeenCalledWith(userId);
      expect(userRepository.deleteById).toHaveBeenCalledWith(userId);
    });

    it("should throw a 404 error when the user does not exist", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(deleteAccount(userId)).rejects.toMatchObject({
        statusCode: 404
      });

      expect(refreshTokenRepository.deleteByUserId).not.toHaveBeenCalled();
      expect(userIdentityRepository.deleteByUserId).not.toHaveBeenCalled();
      expect(userRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
