import { Router } from "express";
import authenticate from "@/middleware/authenticate.js";
import * as userController from "@/controllers/user.js"
import { validate } from "@/middleware/validate.js";
import { updateProfileSchema } from "@/schemas/user.js";


const userRouter = Router()

userRouter.use(authenticate)

userRouter.route("/me")
  .get(userController.getProfileData)
  .patch(validate(updateProfileSchema), userController.updateProfile)
  .delete(userController.deleteProfile);

export default userRouter;