import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/utils/password.js";

describe("Password utilities", () => {
  it("should hash a password", async () => {
    const password = "MySecurePassword123";

    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword).toBeTruthy();
  });

  it("should verify a correct password", async () => {
    const password = "MySecurePassword123";
    const hashedPassword = await hashPassword(password);

    const result = await verifyPassword(password, hashedPassword);

    expect(result).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const hashedPassword = await hashPassword("CorrectPassword123");

    const result = await verifyPassword(
      "WrongPassword123",
      hashedPassword
    );

    expect(result).toBe(false);
  });
});