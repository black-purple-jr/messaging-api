
import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import { REFRESH_TOKEN_SECRET } from "../../../src/config/env.js";
import app from "../../../src/app.js";
import UserModel from "../../../src/models/User.js";
import RefreshTokenModel from "../../../src/models/RefreshToken.js";
import { hashToken } from "../../../src/utils/token-hash.js";


async function createTestUser() {
  const userData = {
    email: "login@example.com",
    username: "loginuser",
    password: "Password123!",
    displayName: "Login User"
  };

  const response = await request(app)
    .post("/auth/register")
    .send(userData);

  expect(response.status).toBe(201);

  return userData;
}


describe("POST /auth/register", () => {
  it("should register a new user successfully", async () => {
    const userData = {
      email: "integration@example.com",
      username: "integrationuser",
      password: "Password123!",
      displayName: "Integration User"
    };

    const response = await request(app)
      .post("/auth/register")
      .send(userData);

    // Verify the HTTP response
    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      user: {
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName
      }
    });

    expect(response.body.user.id).toBeDefined();

    // Verify that the user was actually saved in MongoDB
    const userInDatabase = await UserModel.findOne({
      email: userData.email
    }).select("+passwordHash");

    expect(userInDatabase).not.toBeNull();

    expect(userInDatabase?.username).toBe(userData.username);
    expect(userInDatabase?.displayName).toBe(userData.displayName);

    // Verify that the password was hashed
    expect(userInDatabase?.passwordHash).not.toBe(userData.password);
  });


  it("should reject registration with an existing email", async () => {
    const userData = {
      email: "duplicate@example.com",
      username: "firstuser",
      password: "Password123!",
      displayName: "First User"
    };

    await request(app)
      .post("/auth/register")
      .send(userData);

    const response = await request(app)
      .post("/auth/register")
      .send({
        ...userData,
        username: "seconduser"
      });

    expect(response.status).toBe(409);
  });

  it("should reject registration with an existing username", async () => {
    const userData = {
      email: "first@example.com",
      username: "existinguser",
      password: "Password123!",
      displayName: "First User"
    };

    await request(app)
      .post("/auth/register")
      .send(userData);

    const response = await request(app)
      .post("/auth/register")
      .send({
        ...userData,
        email: "second@example.com"
      });

    expect(response.status).toBe(409);
  });

  it("should reject registration with invalid input", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "invalid@example.com",
        username: "validuser",
        password: "123",
        displayName: "Invalid User"
      });

    expect(response.status).toBe(400);
  });

});



describe("POST /auth/login", () => {
  it("should login successfully using email", async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.email,
        password: user.password
      });

    expect(response.status).toBe(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    expect(response.body.user).toMatchObject({
      username: user.username,
      email: user.email,
      displayName: user.displayName
    });

    // Verify that the refresh token is stored as a hash
    const tokenHash = hashToken(response.body.refreshToken);

    const storedToken = await RefreshTokenModel.findOne({
      tokenHash
    });

    expect(storedToken).not.toBeNull();
    expect(storedToken?.userId.toString()).toBe(response.body.user.id);
    expect(storedToken?.tokenHash).not.toBe(response.body.refreshToken);
  });

  it("should login successfully using username", async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.username,
        password: user.password
      });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.username).toBe(user.username);
  });

  it("should reject login with an incorrect password", async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.email,
        password: "WrongPassword123!"
      });

    expect(response.status).toBe(401);
  });

  it("should reject login when the user does not exist", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        identifier: "unknown@example.com",
        password: "Password123!"
      });

    expect(response.status).toBe(401);
  });
});



describe("POST /auth/refresh", () => {
  it("should rotate refresh tokens successfully", async () => {
    const user = await createTestUser();

    // Login to obtain the initial tokens
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.email,
        password: user.password
      });

    const oldRefreshToken = loginResponse.body.refreshToken;

    // Request token rotation
    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: oldRefreshToken
      });

    expect(response.status).toBe(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    const newRefreshToken = response.body.refreshToken;

    expect(newRefreshToken).not.toBe(oldRefreshToken);

    // Verify that the old token was revoked
    const oldTokenHash = hashToken(oldRefreshToken);

    const oldTokenInDatabase = await RefreshTokenModel.findOne({
      tokenHash: oldTokenHash
    });

    expect(oldTokenInDatabase).not.toBeNull();
    expect(oldTokenInDatabase?.revokedAt).toBeInstanceOf(Date);

    // Verify that the new token was stored as a hash
    const newTokenHash = hashToken(newRefreshToken);

    const newTokenInDatabase = await RefreshTokenModel.findOne({
      tokenHash: newTokenHash
    });

    expect(newTokenInDatabase).not.toBeNull();
    expect(newTokenInDatabase?.revokedAt).toBeNull();
    expect(newTokenInDatabase?.tokenHash).not.toBe(newRefreshToken);
  });

  it("should reject an already rotated refresh token", async () => {
    const user = await createTestUser();

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.email,
        password: user.password
      });

    const oldRefreshToken = loginResponse.body.refreshToken;

    // Rotate the token once
    await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: oldRefreshToken
      });

    // Attempt to reuse the old token
    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: oldRefreshToken
      });

    expect(response.status).toBe(401);
  });

  it("should reject an invalid refresh token", async () => {
    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: "invalid-refresh-token"
      });

    expect(response.status).toBe(401);
  });

  it("should reject an expired refresh token", async () => {
    const expiredToken = jwt.sign(
      { sub: "691234567890123456789012" },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "-1s" }
    );

    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: expiredToken
      });

    expect(response.status).toBe(401);
  });
});


describe("POST /auth/logout", () => {
  it("should logout successfully and delete the refresh token", async () => {
    const user = await createTestUser();

    // Login first
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.email,
        password: user.password
      });

    const refreshToken = loginResponse.body.refreshToken;
    const tokenHash = hashToken(refreshToken);

    // Confirm that the token exists
    const tokenBeforeLogout = await RefreshTokenModel.findOne({
      tokenHash
    });

    expect(tokenBeforeLogout).not.toBeNull();

    // Logout
    const response = await request(app)
      .post("/auth/logout")
      .send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logged out successfully");

    // Confirm that the token was deleted
    const tokenAfterLogout = await RefreshTokenModel.findOne({
      tokenHash
    });

    expect(tokenAfterLogout).toBeNull();
  });

  it("should not allow a logged-out refresh token to be reused", async () => {
    const user = await createTestUser();

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.email,
        password: user.password
      });

    const refreshToken = loginResponse.body.refreshToken;

    await request(app)
      .post("/auth/logout")
      .send({ refreshToken });

    const response = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    expect(response.status).toBe(401);
  });

  it("should handle repeated logout requests", async () => {
    const user = await createTestUser();

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        identifier: user.email,
        password: user.password
      });

    const refreshToken = loginResponse.body.refreshToken;

    const firstResponse = await request(app)
      .post("/auth/logout")
      .send({ refreshToken });

    const secondResponse = await request(app)
      .post("/auth/logout")
      .send({ refreshToken });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
  });

  it("should handle an invalid refresh token", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .send({
        refreshToken: "invalid-refresh-token"
      });

    expect(response.status).toBe(200);
  });
});