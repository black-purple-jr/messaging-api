
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as userRepository from "@/repositories/user.js";
import * as refreshTokenRepository from "@/repositories/refresh-token.js";
import * as pwd from "@/utils/password.js";
import * as jwt from "@/utils/jwt.js";
import { hashToken } from "@/utils/token-hash.js";

import { loginUser } from "@/services/auth.js";

vi.mock("@/repositories/user.js", () => ({
  findByLoginIdentifier: vi.fn()
}));

vi.mock("@/repositories/refresh-token.js", () => ({
  create: vi.fn()
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

describe("loginUser()", () => {
  const userId = "691234567890123456789012";

  const mockUser = {
    _id: { toString: () => userId },
    username: "testuser",
    email: "test@example.com",
    displayName: "Test User",
    passwordHash: "hashed-password"
  };

  const accessToken = "mock-access-token";
  const refreshToken = "mock-refresh-token";

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(userRepository.findByLoginIdentifier)
      .mockResolvedValue(mockUser as never);

    vi.mocked(pwd.verifyPassword)
      .mockResolvedValue(true);

    vi.mocked(jwt.generateAccessToken)
      .mockReturnValue(accessToken);

    vi.mocked(jwt.generateRefreshToken)
      .mockReturnValue(refreshToken);

    vi.mocked(hashToken)
      .mockReturnValue("hashed-refresh-token");

    vi.mocked(refreshTokenRepository.create)
      .mockResolvedValue({} as never);
  });

  it("should log in successfully using an email", async () => {
    const result = await loginUser(
      "test@example.com",
      "password123"
    );

    expect(userRepository.findByLoginIdentifier)
      .toHaveBeenCalledWith("test@example.com");

    expect(pwd.verifyPassword)
      .toHaveBeenCalledWith("password123", "hashed-password");

    expect(jwt.generateAccessToken).toHaveBeenCalledWith(userId);
    expect(jwt.generateRefreshToken).toHaveBeenCalledWith(userId);

    expect(hashToken).toHaveBeenCalledWith(refreshToken);

    expect(refreshTokenRepository.create)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          tokenHash: "hashed-refresh-token",
          expiresAt: expect.any(Date)
        })
      );

    expect(result).toEqual({
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
    vi.mocked(userRepository.findByLoginIdentifier)
      .mockResolvedValue(null);

    await expect(
      loginUser("unknown@example.com", "password123")
    ).rejects.toMatchObject({
      statusCode: 401
    });

    expect(pwd.verifyPassword).not.toHaveBeenCalled();
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it("should reject login if the user has no password", async () => {
    vi.mocked(userRepository.findByLoginIdentifier)
      .mockResolvedValue({
        ...mockUser,
        passwordHash: null
      } as never);

    await expect(
      loginUser("test@example.com", "password123")
    ).rejects.toMatchObject({
      statusCode: 401
    });

    expect(pwd.verifyPassword).not.toHaveBeenCalled();
  });

  it("should reject login with an incorrect password", async () => {
    vi.mocked(pwd.verifyPassword)
      .mockResolvedValue(false);

    await expect(
      loginUser("test@example.com", "wrong-password")
    ).rejects.toMatchObject({
      statusCode: 401
    });

    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });
});
