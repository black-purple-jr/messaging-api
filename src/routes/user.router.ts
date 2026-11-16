import express from "express";

const userRouter = express.Router()

userRouter.route("/:id")
  .get((req, res) => {})
  .patch((req, res) => {})
  .delete((req, res) => {});

export default userRouter;