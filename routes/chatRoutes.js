import express from 'express';
import { createChat } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chats', async (req, res) => {
  try {
    const chat = await createChat(req.body);
    res.json(chat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
