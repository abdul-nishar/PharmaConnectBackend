import chatRouter from "./chatRoutes";
import express from 'express';

const mainRouter = express.Router()

mainRouter.use('/chat',chatRouter);

export default mainRouter;