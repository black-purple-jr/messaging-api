import { beforeEach, describe, expect, it, vi } from "vitest";

import UserModel from "@/models/User.js";
import UserIdentityModel from "@/models/UserIdentity.js";
import RefreshTokenModel from "@/models/RefreshToken.js";

import * as pwd from "@/utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken }from "@/utils/jwt.js";
import { hashToken } from "@/utils/token-hash.js";
import { verifyGoogleToken } from "@/utils/google-auth.js";
import generateUniqueUsername from "@/utils/unique-username.js";

import { registerUser, loginUser, googleLogin, refreshUser,logoutUser } from "@/services/auth.js";
import { deleteAccount } from "@/services/user.js";

// Mock dependencies
vi.mock("@/models/User.js", () => ({
  default: {
    exists: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn()
  }
}));

vi.mock("@/models/UserIdentity.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn()
  }
}));

vi.mock("@/models/RefreshToken.js", () => ({
  default: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn()
  }
}));

vi.mock("@/utils/password.js", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}));

vi.mock("@/utils/jwt.js", () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn()
}));

vi.mock("@/utils/token-hash.js", () => ({
  hashToken: vi.fn()
}));

vi.mock("@/utils/google-auth.js", () => ({
  verifyGoogleToken: vi.fn()
}));

vi.mock("@/utils/unique-username.js", () => ({
  default: vi.fn()
}));

describe("Authentication service", () => {
  const userId = "691234567890123456789012";

  const fakeUser = {
    _id: {
      toString: () => userId
    },
    username: "testuser",
    email: "test@example.com",
    displayName: "Test User",
    avatar: null,
    passwordHash: "hashed-password",
    deleteOne: vi.fn()
  };

  const accessToken = "mock-access-token";
  const refreshToken = "mock-refresh-token";
  const newAccessToken = "new-access-token";
  const newRefreshToken = "new-refresh-token";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(UserModel.exists).mockReturnValue(
      Promise.resolve(null) as never
    );

    vi.mocked(UserModel.create).mockResolvedValue(fakeUser as never);

    vi.mocked(pwd.hashPassword).mockResolvedValue(
      "hashed-password"
    );

    vi.mocked(pwd.verifyPassword).mockResolvedValue(true);

    vi.mocked(generateAccessToken).mockReturnValue(accessToken);
    vi.mocked(generateRefreshToken).mockReturnValue(refreshToken);

    vi.mocked(hashToken).mockImplementation(
      (token) => `hashed-${token}`
    );

    vi.mocked(UserIdentityModel.findOne).mockReturnValue(
      Promise.resolve(null) as never
    );

    vi.mocked(UserIdentityModel.create).mockResolvedValue({} as never);

    vi.mocked(RefreshTokenModel.create).mockResolvedValue({} as never);

    vi.mocked(RefreshTokenModel.findOneAndUpdate).mockReturnValue(
      Promise.resolve({}) as never
    );

    vi.mocked(RefreshTokenModel.deleteOne).mockResolvedValue({} as never);

    vi.mocked(RefreshTokenModel.deleteMany).mockResolvedValue({} as never);

    vi.mocked(UserIdentityModel.deleteMany).mockResolvedValue({} as never);

    vi.mocked(UserModel.findById).mockReturnValue(
      Promise.resolve(fakeUser) as never
    );

    fakeUser.deleteOne.mockResolvedValue({} as never);

    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerUserId: "google-user-123",
      email: "google@example.com",
      emailVerified: true,
      displayName: "Google User",
      picture: "https://example.com/avatar.png"
    });

    vi.mocked(generateUniqueUsername).mockResolvedValue("googleuser");

    vi.mocked(verifyRefreshToken).mockReturnValue(userId);
  });

  // REGISTER
  describe("registerUser()", () => {
    it("should register a new user successfully", async () => {
      const result = await registerUser(
        "test@example.com",
        "testuser",
        "password123",
        "Test User"
      );

      expect(UserModel.exists).toHaveBeenCalledWith({
        $or: [
          { email: "test@example.com" },
          { username: "testuser" }
        ]
      });

      expect(pwd.hashPassword).toHaveBeenCalledWith("password123");

      expect(UserModel.create).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashed-password",
        displayName: "Test User"
      });

      expect(result.user).toEqual({
        id: userId,
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User"
      });
    });

    it("should reject registration if the user already exists", async () => {
      vi.mocked(UserModel.exists).mockReturnValue(
        Promise.resolve({ _id: userId }) as never
      );

      await expect(
        registerUser(
          "test@example.com",
          "testuser",
          "password123",
          "Test User"
        )
      ).rejects.toThrow("User already exists, try logging in");

      expect(pwd.hashPassword).not.toHaveBeenCalled();
      expect(UserModel.create).not.toHaveBeenCalled();
    });
  });

  // LOGIN
  describe("loginUser()", () => {
    it("should log in a user successfully using email", async () => {
      const select = vi.fn().mockResolvedValue(fakeUser);

      vi.mocked(UserModel.findOne).mockReturnValue(
        { select } as never
      );

      const result = await loginUser("test@example.com", "password123");

      expect(UserModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: "test@example.com" },
          { username: "test@example.com" }
        ]
      });

      expect(select).toHaveBeenCalledWith("+passwordHash");

      expect(pwd.verifyPassword).toHaveBeenCalledWith(
        "password123",
        "hashed-password"
      );

      expect(generateAccessToken).toHaveBeenCalledWith(userId);
      expect(generateRefreshToken).toHaveBeenCalledWith(userId);

      expect(hashToken).toHaveBeenCalledWith(refreshToken);

      expect(RefreshTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: fakeUser._id,
          tokenHash: `hashed-${refreshToken}`,
          expiresAt: expect.any(Date)
        })
      );

      expect(result).toMatchObject({
        accessToken,
        refreshToken,
        user: {
          id: userId,
          username: "testuser",
          email: "test@example.com",
          displayName: "Test User"
        }
      });
    });

    it("should reject login if the user does not exist", async () => {
      const select = vi.fn().mockResolvedValue(null);

      vi.mocked(UserModel.findOne).mockReturnValue(
        { select } as never
      );

      await expect(
        loginUser("unknown@example.com", "password123")
      ).rejects.toThrow("Invalid credentials");

      expect(pwd.verifyPassword).not.toHaveBeenCalled();
      expect(RefreshTokenModel.create).not.toHaveBeenCalled();
    });

    it("should reject login if the user has no password", async () => {
      const socialUser = {
        ...fakeUser,
        passwordHash: null
      };

      const select = vi.fn().mockResolvedValue(socialUser);

      vi.mocked(UserModel.findOne).mockReturnValue(
        { select } as never
      );

      await expect(
        loginUser("test@example.com", "password123")
      ).rejects.toThrow("Invalid credentials");

      expect(pwd.verifyPassword).not.toHaveBeenCalled();
    });

    it("should reject login with an incorrect password", async () => {
      const select = vi.fn().mockResolvedValue(fakeUser);

      vi.mocked(UserModel.findOne).mockReturnValue(
        { select } as never
      );

      vi.mocked(pwd.verifyPassword).mockResolvedValue(false);

      await expect(
        loginUser("test@example.com", "wrong-password")
      ).rejects.toThrow("Invalid credentials");

      expect(RefreshTokenModel.create).not.toHaveBeenCalled();
    });
  });

  // GOOGLE LOGIN
  describe("googleLogin()", () => {
    it("should log in an existing Google identity", async () => {
      const identity = {
        userId: fakeUser._id,
        provider: "google",
        providerUserId: "google-user-123"
      };

      vi.mocked(UserIdentityModel.findOne).mockReturnValue(
        Promise.resolve(identity) as never
      );

      const result = await googleLogin("valid-google-id-token");

      expect(verifyGoogleToken).toHaveBeenCalledWith(
        "valid-google-id-token"
      );

      expect(UserModel.findById).toHaveBeenCalledWith(fakeUser._id);

      expect(UserModel.create).not.toHaveBeenCalled();

      expect(result).toMatchObject({
        accessToken,
        refreshToken,
        user: {
          id: userId,
          username: "testuser",
          email: "test@example.com",
          displayName: "Test User",
          avatar: null
        }
      });
    });

    it("should create a new user for a new Google identity", async () => {
      vi.mocked(UserModel.findOne).mockReturnValue(
        Promise.resolve(null) as never
      );

      const result = await googleLogin("valid-google-id-token");

      expect(generateUniqueUsername).toHaveBeenCalledWith(
        "google@example.com"
      );

      expect(UserModel.create).toHaveBeenCalledWith({
        username: "googleuser",
        email: "google@example.com",
        displayName: "Google User",
        avatar: "https://example.com/avatar.png"
      });

      expect(UserIdentityModel.create).toHaveBeenCalledWith({
        userId: fakeUser._id,
        provider: "google",
        providerUserId: "google-user-123"
      });

      expect(result.user.username).toBe("testuser");
    });

    it("should reject a Google account without a verified email", async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue({
        providerUserId: "google-user-123",
        email: "google@example.com",
        emailVerified: false,
        displayName: "Google User",
        picture: undefined
      });

      await expect(
        googleLogin("valid-google-id-token")
      ).rejects.toThrow("Google account must have a verified email.");

      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("should reject a Google account without an email", async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue({
        providerUserId: "google-user-123",
        email: undefined,
        emailVerified: true,
        displayName: "Google User",
        picture: undefined
      });

      await expect(
        googleLogin("valid-google-id-token")
      ).rejects.toThrow("Google account must have a verified email.");
    });

    it("should reject a Google account if the email already belongs to another user", async () => {
      vi.mocked(UserModel.findOne).mockReturnValue(
        Promise.resolve(fakeUser) as never
      );

      await expect(
        googleLogin("valid-google-id-token")
      ).rejects.toThrow(
        "An account with this email already exists. Sign in using your existing method."
      );

      expect(UserModel.create).not.toHaveBeenCalled();
      expect(UserIdentityModel.create).not.toHaveBeenCalled();
    });
  });

  // REFRESH TOKEN
  describe("refreshUser()", () => {
    it("should rotate a valid refresh token", async () => {
      vi.mocked(generateAccessToken).mockReturnValue(newAccessToken);
      vi.mocked(generateRefreshToken).mockReturnValue(newRefreshToken);

      const result = await refreshUser(refreshToken);

      expect(verifyRefreshToken).toHaveBeenCalledWith(refreshToken);

      expect(RefreshTokenModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          tokenHash: `hashed-${refreshToken}`,
          userId,
          revokedAt: null,
          expiresAt: { $gt: expect.any(Date) }
        },
        {
          $set: { revokedAt: expect.any(Date) }
        },
        { new: false }
      );

      expect(RefreshTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          tokenHash: `hashed-${newRefreshToken}`,
          expiresAt: expect.any(Date)
        })
      );

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    });

    it("should reject an invalid refresh JWT", async () => {
      vi.mocked(verifyRefreshToken).mockImplementation(() => {
        throw new Error("Invalid refresh token");
      });

      await expect(
        refreshUser("invalid-token")
      ).rejects.toThrow("Invalid refresh token");

      expect(RefreshTokenModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(RefreshTokenModel.create).not.toHaveBeenCalled();
    });

    it("should reject a refresh token that is not active in the database", async () => {
      vi.mocked(RefreshTokenModel.findOneAndUpdate).mockReturnValue(
        Promise.resolve(null) as never
      );

      await expect(
        refreshUser(refreshToken)
      ).rejects.toThrow("Invalid refresh token");

      expect(RefreshTokenModel.create).not.toHaveBeenCalled();
    });
  });

  // LOGOUT
  describe("logoutUser()", () => {
    it("should delete the matching active refresh token", async () => {
      await logoutUser(refreshToken);

      expect(hashToken).toHaveBeenCalledWith(refreshToken);

      expect(RefreshTokenModel.deleteOne).toHaveBeenCalledWith({
        tokenHash: `hashed-${refreshToken}`,
        expiresAt: { $gt: expect.any(Date) }
      });
    });
  });

  // DELETE ACCOUNT
  describe("deleteAccount()", () => {
    it("should delete the user, refresh tokens, and linked identities", async () => {
      await deleteAccount(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);

      expect(RefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        userId: fakeUser._id
      });

      expect(UserIdentityModel.deleteMany).toHaveBeenCalledWith({
        userId: fakeUser._id
      });

      expect(fakeUser.deleteOne).toHaveBeenCalledOnce();
    });

    it("should reject if the user does not exist", async () => {
      vi.mocked(UserModel.findById).mockReturnValue(
        Promise.resolve(null) as never
      );

      await expect(
        deleteAccount(userId)
      ).rejects.toThrow("User not found");

      expect(RefreshTokenModel.deleteMany).not.toHaveBeenCalled();
      expect(UserIdentityModel.deleteMany).not.toHaveBeenCalled();
    });
  });
});
