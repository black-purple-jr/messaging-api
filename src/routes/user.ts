import { Router } from "express";
import authenticate from "@/middleware/authenticate.js";
import * as userController from "@/controllers/user.js"


const userRouter = Router()

userRouter.use(authenticate)

userRouter.route("/me")
  .get(userController.getProfileData)
  .patch(userController.updateProfile)
  .delete(userController.deleteProfile);

export default userRouter;