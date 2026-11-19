
import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import authenticate from "../../../src/middleware/authenticate.js";
import { JWT_SECRET } from "@/config/env.js";

describe("Authentication middleware", () => {
  const userId = "691234567890123456789012";

  function createMocks(authorization?: string) {
    const req = {
      headers: { authorization }
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  }

  it("should authenticate a request with a valid access token", () => {
    const token = jwt.sign({ sub: userId }, JWT_SECRET, {
      expiresIn: "20m"
    });

    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(req.user).toEqual({ id: userId });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should reject a request without an authorization header", () => {
    const { req, res, next } = createMocks();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an authorization header with an incorrect scheme", () => {
    const { req, res, next } = createMocks("Basic some-token");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an authorization header without a token", () => {
    const { req, res, next } = createMocks("Bearer ");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid authorization header"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an invalid access token", () => {
    const { req, res, next } = createMocks("Bearer invalid-token");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired access token"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an expired access token", () => {
    const token = jwt.sign({ sub: userId }, JWT_SECRET, {
      expiresIn: -1
    });

    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired access token"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject a token without a subject", () => {
    const token = jwt.sign({ username: "test-user" }, JWT_SECRET);

    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid access token"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject a token with a string payload", () => {
    const token = jwt.sign("invalid-payload", JWT_SECRET);

    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid access token"
    });
    expect(next).not.toHaveBeenCalled();
  });
});
