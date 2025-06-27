import chatRouter from "./chatRoutes.js";
import appointmentRouter from './appointmentRoutes.js'
import userRouter from './userRoutes.js'
import express from 'express';

const mainRouter = express.Router()

mainRouter.use('/chat',chatRouter);
mainRouter.use('/appointments', appointmentRouter)
mainRouter.use('/users', userRouter)

export default router;
