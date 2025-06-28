import express from "express";
import { getChatSummaries, getChatMessages, createNewChat } from "../controllers/chatController.js";

const router = express.Router();

// POST /api/chat - Create a new chat
router.post("/", createNewChat);

// GET /api/chat/chatSummaries - Returns a list of chat summaries for the sidebar
router.get('/chatSummaries', getChatSummaries);

// GET /api/chat/:chatId/messages - Returns message history for a specific chat, only if user has access
router.get('/:chatId/messages', getChatMessages);

export default router;
