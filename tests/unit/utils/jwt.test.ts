
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../../src/utils/jwt.js";
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from "../../../src/config/env.js";

describe("JWT utilities", () => {
  const userId = "691234567890123456789012";

  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const token = generateAccessToken(userId);

      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded).toMatchObject({
        sub: userId
      });
    });

    it("should expire after 20 minutes", () => {
      const token = generateAccessToken(userId);

      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      expect(decoded.exp! - decoded.iat!).toBe(20 * 60);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid refresh token", () => {
      const token = generateRefreshToken(userId);

      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

      expect(decoded).toMatchObject({
        sub: userId
      });
    });

    it("should expire after 20 days", () => {
      const token = generateRefreshToken(userId);

      const decoded = jwt.verify(
        token,
        REFRESH_TOKEN_SECRET
      ) as jwt.JwtPayload;

      expect(decoded.exp! - decoded.iat!).toBe(20 * 24 * 60 * 60);
    });
  });

  describe("verifyRefreshToken", () => {
    it("should return the user ID from a valid refresh token", () => {
      const token = generateRefreshToken(userId);

      const result = verifyRefreshToken(token);

      expect(result).toBe(userId);
    });

    it("should reject an invalid token", () => {
      expect(() => verifyRefreshToken("invalid-token"))
        .toThrow();
    });

    it("should reject a token signed with the wrong secret", () => {
      const token = jwt.sign(
        { sub: userId },
        "wrong-secret",
        { expiresIn: "20d" }
      );

      expect(() => verifyRefreshToken(token))
        .toThrow();
    });

    it("should reject an expired refresh token", () => {
      const token = jwt.sign(
        { sub: userId },
        REFRESH_TOKEN_SECRET,
        { expiresIn: "-1s" }
      );

      expect(() => verifyRefreshToken(token))
        .toThrow();
    });
  });
});
