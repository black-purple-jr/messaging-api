import express from "express";

const userRouter = express.Router()

userRouter.route("/:id")
  .get((req, res) => {})
  .put((req, res) => {})
  .delete((req, res) => {});

export default userRouter;