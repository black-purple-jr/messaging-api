import Router from "express";
import authenticate from "@/middleware/auth.middleware.js";
import * as userController from "@/controllers/user.controller.js"


const userRouter = Router()

userRouter.get("/:id")

userRouter.route("/me")
  .patch((req, res) => {})
  .delete(authenticate, userController.deleteProfile)

export default userRouter;