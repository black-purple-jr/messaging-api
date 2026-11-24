
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as refreshTokenRepository from "@/repositories/refresh-token.js";
import * as jwt from "@/utils/jwt.js";
import { hashToken } from "@/utils/token-hash.js";

import { refreshUser } from "@/services/auth.js";

vi.mock("@/repositories/refresh-token.js", () => ({
  revokeActiveToken: vi.fn(),
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

describe("refreshUser()", () => {
  const userId = "691234567890123456789012";

  const oldRefreshToken = "old-refresh-token";
  const newRefreshToken = "new-refresh-token";
  const newAccessToken = "new-access-token";

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(jwt.verifyRefreshToken)
      .mockReturnValue(userId);

    vi.mocked(jwt.generateAccessToken)
      .mockReturnValue(newAccessToken);

    vi.mocked(jwt.generateRefreshToken)
      .mockReturnValue(newRefreshToken);

    vi.mocked(hashToken)
      .mockImplementation((token) => `hashed-${token}`);

    vi.mocked(refreshTokenRepository.revokeActiveToken)
      .mockResolvedValue({} as never);

    vi.mocked(refreshTokenRepository.create)
      .mockResolvedValue({} as never);
  });

  it("should rotate a valid refresh token", async () => {
    const result = await refreshUser(oldRefreshToken);

    expect(jwt.verifyRefreshToken)
      .toHaveBeenCalledWith(oldRefreshToken);

    expect(refreshTokenRepository.revokeActiveToken)
      .toHaveBeenCalledWith(
        `hashed-${oldRefreshToken}`,
        userId
      );

    expect(refreshTokenRepository.create)
      .toHaveBeenCalledWith(
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
    vi.mocked(jwt.verifyRefreshToken).mockImplementation(() => {
      throw new Error("Invalid refresh token");
    });

    await expect(
      refreshUser("invalid-token")
    ).rejects.toThrow("Invalid refresh token");

    expect(refreshTokenRepository.revokeActiveToken)
      .not.toHaveBeenCalled();

    expect(refreshTokenRepository.create)
      .not.toHaveBeenCalled();
  });

  it("should reject a refresh token that is not active in the database", async () => {
    vi.mocked(refreshTokenRepository.revokeActiveToken)
      .mockResolvedValue(null);

    await expect(
      refreshUser(oldRefreshToken)
    ).rejects.toMatchObject({
      statusCode: 401
    });

    expect(refreshTokenRepository.create)
      .not.toHaveBeenCalled();
  });
});
