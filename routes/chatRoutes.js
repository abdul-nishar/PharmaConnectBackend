import express from "express";
import Chat from "../models/chat.js";
import { createChat } from "../controllers/chatController.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const chats = await Chat.find().select("id title lastMessage timestamp");
  res.json(chats);
});

router.get("/:id", async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  res.json(chat?.messageHistory || []);
});

router.post('/chats', async (req, res) => {
  try {
    const chat = await createChat(req.body);
    res.json(chat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
