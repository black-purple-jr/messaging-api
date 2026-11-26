import * as friendRequestController from "@/controllers/friend-request.js";
import authenticate from "@/middleware/authenticate.js";
import { Router } from "express";

const friendRequestRouter = Router();
friendRequestRouter.use(authenticate);

friendRequestRouter.post("/", friendRequestController.sendFriendRequest);
friendRequestRouter.get("/received", friendRequestController.getAllReceivedFriendRequests);
friendRequestRouter.get("/sent", friendRequestController.getAllSentFriendRequests);
friendRequestRouter.patch("/:requestId/accept", friendRequestController.acceptFriendRequest);
friendRequestRouter.patch("/:requestId/reject", friendRequestController.rejectFriendRequest);
friendRequestRouter.delete("/:requestId", friendRequestController.deleteFriendRequest);

export default friendRequestRouter;