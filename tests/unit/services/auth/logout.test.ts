
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as refreshTokenRepository from "@/repositories/refresh-token.js";
import { hashToken } from "@/utils/token-hash.js";

import { logoutUser } from "@/services/auth.js";

vi.mock("@/repositories/refresh-token.js", () => ({
  deleteByTokenHash: vi.fn()
}));

vi.mock("@/utils/token-hash.js", () => ({
  hashToken: vi.fn()
}));

describe("logoutUser()", () => {
  const refreshToken = "mock-refresh-token";

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(hashToken)
      .mockReturnValue("hashed-refresh-token");

    vi.mocked(refreshTokenRepository.deleteByTokenHash)
      .mockResolvedValue({} as never);
  });

  it("should delete the matching refresh token", async () => {
    await logoutUser(refreshToken);

    expect(hashToken).toHaveBeenCalledWith(refreshToken);

    expect(refreshTokenRepository.deleteByTokenHash)
      .toHaveBeenCalledWith("hashed-refresh-token");
  });
});
