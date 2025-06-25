import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';
import handleSocket from './sockets/chatSockets.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use('/api', chatRoutes);

handleSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
