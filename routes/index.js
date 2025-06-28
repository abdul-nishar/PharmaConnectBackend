import { protect } from "../controllers/authController.js";
import chatRouter from "./chatRoutes.js";
import userRouter from "./userRoutes.js";
import medicineRouter from "./medicineRoutes.js"
import orderRoutes from './orderRoutes.js'

import express from "express";

const router = express.Router();

router.use("/users", userRouter);
router.use(protect);
router.use("/chat", chatRouter);
router.use('/medicines',medicineRouter);
router.use('/orders',orderRoutes);

export default router;
