
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as userRepository from "@/repositories/user.js";
import * as userIdentityRepository from "@/repositories/user-identity.js";
import * as refreshTokenRepository from "@/repositories/refresh-token.js";

import * as jwt from "@/utils/jwt.js";
import { hashToken } from "@/utils/token-hash.js";
import { verifyGoogleToken } from "@/utils/google-auth.js";
import generateUniqueUsername from "@/utils/unique-username.js";

import { googleLogin } from "@/services/auth.js";

vi.mock("@/repositories/user.js", () => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn()
}));

vi.mock("@/repositories/user-identity.js", () => ({
  findByProviderAndProviderUserId: vi.fn(),
  create: vi.fn()
}));

vi.mock("@/repositories/refresh-token.js", () => ({
  create: vi.fn()
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

describe("googleLogin()", () => {
  const userId = "691234567890123456789012";

  const mockUser = {
    _id: { toString: () => userId },
    username: "testuser",
    email: "google@example.com",
    displayName: "Google User",
    avatar: "https://example.com/avatar.png"
  };

  const accessToken = "mock-access-token";
  const refreshToken = "mock-refresh-token";

  const googleUser = {
    providerUserId: "google-user-123",
    email: "google@example.com",
    emailVerified: true,
    displayName: "Google User",
    picture: "https://example.com/avatar.png"
  };

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(verifyGoogleToken)
      .mockResolvedValue(googleUser);

    vi.mocked(userIdentityRepository.findByProviderAndProviderUserId)
      .mockResolvedValue(null);

    vi.mocked(userRepository.findByEmail)
      .mockResolvedValue(null);

    vi.mocked(userRepository.create)
      .mockResolvedValue(mockUser as never);

    vi.mocked(userIdentityRepository.create)
      .mockResolvedValue({} as never);

    vi.mocked(refreshTokenRepository.create)
      .mockResolvedValue({} as never);

    vi.mocked(generateUniqueUsername)
      .mockResolvedValue("testuser");

    vi.mocked(jwt.generateAccessToken)
      .mockReturnValue(accessToken);

    vi.mocked(jwt.generateRefreshToken)
      .mockReturnValue(refreshToken);

    vi.mocked(hashToken)
      .mockReturnValue("hashed-refresh-token");
  });

  it("should log in an existing Google identity", async () => {
    vi.mocked(userIdentityRepository.findByProviderAndProviderUserId)
      .mockResolvedValue({
        userId: { toString: () => userId }
      } as never);

    vi.mocked(userRepository.findById)
      .mockResolvedValue(mockUser as never);

    const result = await googleLogin("valid-google-id-token");

    expect(verifyGoogleToken)
      .toHaveBeenCalledWith("valid-google-id-token");

    expect(userRepository.findById)
      .toHaveBeenCalledWith(userId);

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userIdentityRepository.create).not.toHaveBeenCalled();

    expect(result.user.username).toBe("testuser");
    expect(result.accessToken).toBe(accessToken);
  });

  it("should create a new user for a new Google identity", async () => {
    const result = await googleLogin("valid-google-id-token");

    expect(generateUniqueUsername)
      .toHaveBeenCalledWith("google@example.com");

    expect(userRepository.create)
      .toHaveBeenCalledWith({
        username: "testuser",
        email: "google@example.com",
        displayName: "Google User",
        avatar: "https://example.com/avatar.png"
      });

    expect(userIdentityRepository.create)
      .toHaveBeenCalledWith({
        userId,
        provider: "google",
        providerUserId: "google-user-123"
      });

    expect(result.user.username).toBe("testuser");
  });

  it("should reject a Google account without a verified email", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      ...googleUser,
      emailVerified: false
    });

    await expect(
      googleLogin("invalid-google-id-token")
    ).rejects.toMatchObject({
      statusCode: 401
    });

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("should reject a Google account without an email", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      ...googleUser,
      email: undefined
    });

    await expect(
      googleLogin("invalid-google-id-token")
    ).rejects.toMatchObject({
      statusCode: 401
    });
  });

  it("should reject an email already associated with another account", async () => {
    vi.mocked(userRepository.findByEmail)
      .mockResolvedValue(mockUser as never);

    await expect(
      googleLogin("valid-google-id-token")
    ).rejects.toMatchObject({
      statusCode: 409
    });

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userIdentityRepository.create).not.toHaveBeenCalled();
  });

  it("should reject an invalid Google ID token", async () => {
    vi.mocked(verifyGoogleToken)
      .mockRejectedValue(new Error("Invalid Google ID token"));

    await expect(
      googleLogin("invalid-google-id-token")
    ).rejects.toMatchObject({
      message: "Invalid or expired Google ID token.",
      statusCode: 401
    });

    expect(userIdentityRepository.findByProviderAndProviderUserId)
      .not.toHaveBeenCalled();

    expect(userRepository.create)
      .not.toHaveBeenCalled();
  });
});
