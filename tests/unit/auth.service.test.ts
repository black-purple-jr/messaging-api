import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/models/User.model.js", () => ({
  default: {
    exists: vi.fn(),
    create: vi.fn()
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

vi.mock("@/models/RefreshToken.model.js", () => ({
  default: {
    create: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  }
}));

vi.mock("@/utils/google-auth.js", () => ({
  verifyGoogleToken: vi.fn()
}));

vi.mock("@/models/UserIdentity.model.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn()
  }
}));

vi.mock("@/utils/unique-username.js", () => ({
  default: vi.fn()
}));

// Imports
import UserModel from "@/models/User.model.js";
import * as pwd from "@/utils/password.js";
import { registerUser } from "@/services/auth.service.js";

describe("Authentication service", () => {
  const userId = "691234567890123456789012";

  const user = {
    _id: {
      toString: () => userId
    },
    username: "abdellah",
    email: "abdellah@example.com",
    displayName: "Abdellah"
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(UserModel.exists).mockImplementation(
      (async () => null) as never
    );

    vi.mocked(pwd.hashPassword).mockResolvedValue(
      "hashed-password"
    );

    vi.mocked(UserModel.create).mockImplementation(
      (async () => user) as never
    );
  });

  describe("registerUser", () => {
    it("should successfully register a new user", async () => {
      const result = await registerUser(
        "abdellah@example.com",
        "abdellah",
        "MySecurePassword123",
        "Abdellah"
      );

      expect(result).toEqual({
        user: {
          id: userId,
          username: "abdellah",
          email: "abdellah@example.com",
          displayName: "Abdellah"
        }
      });

      expect(UserModel.exists).toHaveBeenCalledWith({
        $or: [
          { email: "abdellah@example.com" },
          { username: "abdellah" }
        ]
      });

      expect(pwd.hashPassword).toHaveBeenCalledWith(
        "MySecurePassword123"
      );

      expect(UserModel.create).toHaveBeenCalledWith({
        username: "abdellah",
        email: "abdellah@example.com",
        passwordHash: "hashed-password",
        displayName: "Abdellah"
      });
    });

    it("should reject an existing user", async () => {
      vi.mocked(UserModel.exists).mockImplementation(
        (async () => ({ _id: userId })) as never
      );

      await expect(
        registerUser(
          "abdellah@example.com",
          "abdellah",
          "MySecurePassword123",
          "Abdellah"
        )
      ).rejects.toThrow(
        "User already exists, try logging in"
      );

      expect(pwd.hashPassword).not.toHaveBeenCalled();
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("should never return the password hash", async () => {
      const result = await registerUser(
        "abdellah@example.com",
        "abdellah",
        "MySecurePassword123",
        "Abdellah"
      );

      expect(result.user).not.toHaveProperty("passwordHash");
    });
  });
});
