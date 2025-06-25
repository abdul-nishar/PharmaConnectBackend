import express , { json } from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import Chat from './models/chat.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Or set to your frontend's domain
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI,{
    ssl: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error', err));

// Socket.IO Chat Logic
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('joinChat', async (chatId) => {
    socket.join(chatId);
    const chat = await findById(chatId);
    socket.emit('chatHistory', chat?.messageHistory || []);
  });

  socket.on('newMessage', async ({ chatId, role, message }) => {
    const msg = { role, message, timestamp: new Date() };

    let chat = await findById(chatId);
    if (!chat) {
      // New Chat
      chat = new Chat({
        title: message.slice(0, 30),
        messageHistory: [msg],
        lastMessage: msg
      });
    } else {
      chat.messageHistory.push(msg);
      chat.lastMessage = msg;
    }

    await chat.save();

    io.to(chatId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
