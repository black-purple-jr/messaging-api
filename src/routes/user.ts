import Router from "express";
import authenticate from "@/middleware/authenticate.js";
import * as userController from "@/controllers/user.js"


const userRouter = Router()

userRouter.get("/:id")

userRouter.route("/me")
  .patch(authenticate, userController.updateProfile)
  .delete(authenticate, userController.deleteProfile);

export default userRouter;