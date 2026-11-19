
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { hashToken } from "@/utils/token-hash.js";

describe("Token hash utility", () => {
  const token = "sample-refresh-token";

  it("should return a SHA-256 hash", () => {
    const hashedToken = hashToken(token);

    const expectedHash = createHash("sha256")
      .update(token)
      .digest("hex");

    expect(hashedToken).toBe(expectedHash);
  });

  it("should return the same hash for the same token", () => {
    const firstHash = hashToken(token);
    const secondHash = hashToken(token);

    expect(firstHash).toBe(secondHash);
  });

  it("should return different hashes for different tokens", () => {
    const firstHash = hashToken("first-token");
    const secondHash = hashToken("second-token");

    expect(firstHash).not.toBe(secondHash);
  });
});
