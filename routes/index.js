import { protect } from "../controllers/authController.js";
import chatRouter from "./chatRoutes.js";
import appointmentRouter from "./appointmentRoutes.js";
import doctorsRouter from "./doctorRoutes.js"
import userRouter from "./userRoutes.js";
import medicineRouter from "./medicineRoutes.js"
import orderRoutes from './orderRoutes.js'

import express from "express";

const mainRouter = express.Router();

mainRouter.use("/users", userRouter);
mainRouter.use(protect);
mainRouter.use("/chat", chatRouter);
mainRouter.use("/appointments", appointmentRouter)
mainRouter.use("/doctors", doctorsRouter)
mainRouter.use('/medicines', medicineRouter);
mainRouter.use('/orders', orderRoutes);

export default mainRouter;