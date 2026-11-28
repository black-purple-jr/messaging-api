import { Router } from "express";
import * as friendController from "@/controllers/friend.js";
import authenticate from "@/middleware/authenticate.js";

const friendRouter = Router();

friendRouter.use(authenticate);

friendRouter.get("/", friendController.getAllFriends);
friendRouter.delete("/:friendId", friendController.removeFriend);

export default friendRouter;