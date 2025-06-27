import { addMessage } from '../controllers/chatController.js';
import Chat from '../models/chatModel.js';

export default function handleSocket(io) {
  io.on('connection', (socket) => {
    socket.on('joinChat', async (chatId) => {
      socket.join(chatId);
      const chat = await Chat.findById(chatId);
      socket.emit('chatHistory', chat?.messageHistory || []);
    });

    socket.on('newMessage', async ({ chatId, role, message }) => {
      const msg = await addMessage(chatId, {
        role,
        message,
        timestamp: new Date()
      });
      io.to(chatId).emit('message', msg);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}
