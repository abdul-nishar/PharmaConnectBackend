import chatRouter from "./chatRoutes.js";
import appointmentRouter from "./appointmentRoutes.js";
import doctorsRouter from "./doctorRoutes.js";
import userRouter from "./userRoutes.js";
import medicineRouter from "./medicineRoutes.js";
import orderRoutes from "./orderRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import protect from "../middlewares/protect.js";

import express from "express";
import errorHandler from "../middlewares/errorHandler.js";

const router = express.Router();

router.use("/users", userRouter);
router.use("/payment", paymentRoutes);
router.use(protect);
router.use("/chat", chatRouter);
router.use("/appointments", appointmentRouter);
router.use("/doctors", doctorsRouter);
router.use("/medicines", medicineRouter);
router.use("/orders", orderRoutes);

router.use(errorHandler)

export default router;
