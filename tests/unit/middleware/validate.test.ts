
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

import { validate } from "@/middleware/validate.js";

describe("Validation middleware", () => {
  const schema = z.object({
    email: z.email(),
    password: z.string().min(8)
  });

  function createMocks(body: unknown) {
    const req = { body } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  }

  it("should call next() when the request body is valid", () => {
    const { req, res, next } = createMocks({
      email: "test@example.com",
      password: "password123"
    });

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should reject an invalid email", () => {
    const { req, res, next } = createMocks({
      email: "invalid-email",
      password: "password123"
    });

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            path: ["email"]
          })
        ])
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject a password shorter than 8 characters", () => {
    const { req, res, next } = createMocks({
      email: "test@example.com",
      password: "short"
    });

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            path: ["password"]
          })
        ])
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject a request with missing required fields", () => {
    const { req, res, next } = createMocks({});

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: expect.any(Array)
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an empty request body", () => {
    const { req, res, next } = createMocks(undefined);

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed"
      })
    );

    expect(next).not.toHaveBeenCalled();
  });
});
