
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserModel from "../../../src/models/User.js";
import RefreshTokenModel from "../../../src/models/RefreshToken.js";
import UserIdentityModel from "../../../src/models/UserIdentity.js";
import {
  getProfileData,
  updateProfile,
  deleteAccount
} from "../../../src/services/user.js";

vi.mock("../../../src/models/User.js", () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn()
  }
}));

vi.mock("../../../src/models/RefreshToken.js", () => ({
  default: {
    deleteMany: vi.fn()
  }
}));

vi.mock("../../../src/models/UserIdentity.js", () => ({
  default: {
    deleteMany: vi.fn()
  }
}));

describe("User service", () => {
  const userId = "691234567890123456789012";

  const mockUser = {
    _id: userId,
    id: userId,
    username: "testuser",
    email: "test@example.com",
    displayName: "Test User",
    avatar: null,
    save: vi.fn(),
    deleteOne: vi.fn()
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getProfileData", () => {
    it("should return the user's profile", async () => {
      vi.mocked(UserModel.findById).mockResolvedValue(mockUser as never);

      const result = await getProfileData(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: userId,
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User",
        avatar: null
      });
    });

    it("should throw a 404 error when the user does not exist", async () => {
      vi.mocked(UserModel.findById).mockResolvedValue(null);

      await expect(getProfileData(userId)).rejects.toMatchObject({
        statusCode: 404
      });
    });
  });

  describe("updateProfile", () => {
    it("should update the user's profile", async () => {
      const updatedUser = { ...mockUser };

      vi.mocked(UserModel.findById).mockResolvedValue(updatedUser as never);
      updatedUser.save.mockResolvedValue(updatedUser);

      const result = await updateProfile(userId, {
        displayName: "Updated Name"
      });

      expect(updatedUser.displayName).toBe("Updated Name");
      expect(updatedUser.save).toHaveBeenCalled();
      expect(result.displayName).toBe("Updated Name");
    });

    it("should throw a 404 error when the user does not exist", async () => {
      vi.mocked(UserModel.findById).mockResolvedValue(null);

      await expect(
        updateProfile(userId, { displayName: "Updated Name" })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw a 409 error when the username is already taken", async () => {
      vi.mocked(UserModel.findById).mockResolvedValue(mockUser as never);
      vi.mocked(UserModel.findOne).mockResolvedValue({ _id: "another-user" } as never);

      await expect(
        updateProfile(userId, { username: "takenname" })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("should convert a duplicate username database error into a 409 error", async () => {
      const updatedUser = { ...mockUser };

      vi.mocked(UserModel.findById).mockResolvedValue(updatedUser as never);
      vi.mocked(UserModel.findOne).mockResolvedValue(null);

      updatedUser.save.mockRejectedValue({
        code: 11000,
        keyPattern: { username: 1 }
      });

      await expect(
        updateProfile(userId, { username: "newname" })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("should propagate unexpected database errors", async () => {
      const updatedUser = { ...mockUser };
      const databaseError = new Error("Database connection failed");

      vi.mocked(UserModel.findById).mockResolvedValue(updatedUser as never);
      updatedUser.save.mockRejectedValue(databaseError);

      await expect(
        updateProfile(userId, { displayName: "Updated Name" })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("deleteAccount", () => {
    it("should delete the user's refresh tokens, identities, and account", async () => {
      vi.mocked(UserModel.findById).mockResolvedValue(mockUser as never);
      vi.mocked(RefreshTokenModel.deleteMany).mockResolvedValue({} as never);
      vi.mocked(UserIdentityModel.deleteMany).mockResolvedValue({} as never);
      mockUser.deleteOne.mockResolvedValue({} as never);

      await deleteAccount(userId);

      expect(RefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        userId: mockUser._id
      });

      expect(UserIdentityModel.deleteMany).toHaveBeenCalledWith({
        userId: mockUser._id
      });

      expect(mockUser.deleteOne).toHaveBeenCalled();
    });

    it("should throw a 404 error when the user does not exist", async () => {
      vi.mocked(UserModel.findById).mockResolvedValue(null);

      await expect(deleteAccount(userId)).rejects.toMatchObject({
        statusCode: 404
      });

      expect(RefreshTokenModel.deleteMany).not.toHaveBeenCalled();
      expect(UserIdentityModel.deleteMany).not.toHaveBeenCalled();
    });
  });
});