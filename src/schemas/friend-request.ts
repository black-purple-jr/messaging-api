import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ID format",
});

export const sendFriendRequestSchema = z.object({
  receiverId: objectIdSchema,
});

export const friendRequestParamsSchema = z.object({
  requestId: objectIdSchema,
});
