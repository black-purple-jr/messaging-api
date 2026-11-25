import authenticate from "@/middleware/authenticate.js";
import { Router } from "express";

const friendRequestRouter = Router();
friendRequestRouter.use(authenticate);

friendRequestRouter.post("/");
friendRequestRouter.get("/received");
friendRequestRouter.get("/sent");
friendRequestRouter.patch("/:requestId/accept");
friendRequestRouter.patch("/:requestId/reject");
friendRequestRouter.delete("/:requestId");

export default friendRequestRouter;