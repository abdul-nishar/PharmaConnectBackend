import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['System', 'User', 'Assistant'],
    required: true
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lastMessage: {
    role: String,
    message: String,
    timestamp: Date
  },
  messageHistory: [MessageSchema]
});

export default mongoose.model('Chat', ChatSchema);