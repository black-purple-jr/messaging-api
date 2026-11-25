
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as userRepository from "@/repositories/user.js";
import * as pwd from "@/utils/password.js";
import { registerUser } from "@/services/auth.js";

vi.mock("@/repositories/user.js", () => ({
  existsByEmailOrUsername: vi.fn(),
  create: vi.fn()
}));

vi.mock("@/utils/password.js", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}));

describe("registerUser()", () => {
  const userId = "691234567890123456789012";

  const mockUser = {
    _id: { toString: () => userId },
    username: "testuser",
    email: "test@example.com",
    displayName: "Test User"
  };

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(userRepository.existsByEmailOrUsername)
      .mockResolvedValue(null as never);

    vi.mocked(pwd.hashPassword)
      .mockResolvedValue("hashed-password");

    vi.mocked(userRepository.create)
      .mockResolvedValue(mockUser as never);
  });

  it("should register a new user successfully", async () => {
    const result = await registerUser(
      "test@example.com",
      "testuser",
      "password123",
      "Test User"
    );

    expect(userRepository.existsByEmailOrUsername)
      .toHaveBeenCalledWith("test@example.com", "testuser");

    expect(pwd.hashPassword)
      .toHaveBeenCalledWith("password123");

    expect(userRepository.create)
      .toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashed-password",
        displayName: "Test User"
      });

    expect(result).toEqual({
      user: {
        id: userId,
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User"
      }
    });
  });

  it("should reject registration if the user already exists", async () => {
    vi.mocked(userRepository.existsByEmailOrUsername)
      .mockResolvedValue({ _id: userId } as never);

    await expect(
      registerUser(
        "test@example.com",
        "testuser",
        "password123",
        "Test User"
      )
    ).rejects.toMatchObject({
      statusCode: 409
    });

    expect(pwd.hashPassword).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("should reject registration when MongoDB reports a duplicate key", async () => {
    vi.mocked(userRepository.create)
      .mockRejectedValue({ code: 11000 });

    await expect(
      registerUser(
        "test@example.com",
        "testuser",
        "password123",
        "Test User"
      )
    ).rejects.toMatchObject({
      message: "User already exists, try logging in",
      statusCode: 409
    });

    expect(userRepository.existsByEmailOrUsername)
      .toHaveBeenCalled();

    expect(userRepository.create)
      .toHaveBeenCalled();
  });
});
