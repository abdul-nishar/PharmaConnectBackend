import chatRouter from "./chatRoutes.js";
import userRouter from "./userRoutes.js";

import express from "express";

const router = express.Router();

router.use("/chat", chatRouter);
router.use("/users", userRouter);

export default router;
