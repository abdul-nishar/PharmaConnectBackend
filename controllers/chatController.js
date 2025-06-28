import Chat from '../models/chatModel.js';
import OpenAIClient from '../utils/openaiClient.js';

// Controller for chat summaries
export const getChatSummaries = async (req, res) => {
  try {
    // User is available from req.user (set by protect middleware)
    const user = req.user;
    // Get chatIds for the user (patient or doctor)
    const chatIds = user.chatIds || [];
    if (!chatIds.length) {
      return res.json({ success: true, data: [] });
    }
    // Fetch only chats the user is a part of
    const chats = await Chat.find({ _id: { $in: chatIds } }, 'title lastMessage.timestamp lastMessage.message lastMessage.role').sort({'lastMessage.timestamp': -1});
    const summaries = chats.map(chat => ({
      id: chat._id,
      title: chat.title,
      lastMessage: chat.lastMessage?.message || '',
      timestamp: chat.lastMessage?.timestamp || null
    }));
    res.json({ success: true, data: summaries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chat summaries', error: error.message });
  }
};

// GET /api/chat/:chatId/messages - Returns message history for a specific chat, only if user has access
export const getChatMessages = async (req, res) => {
  try {
    const user = req.user;
    const chatId = req.params.chatId;
    const chatIds = user.chatIds || [];
    // Check if user has access to this chat
    if (!chatIds.map(id => id.toString()).includes(chatId)) {
      return res.status(403).json({ success: false, message: 'Access denied to this chat.' });
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }
    res.json({ success: true, data: chat.messageHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chat messages', error: error.message });
  }
};

// Helper: Format chat history for OpenAI API
const formatChatHistoryForOpenAI = (history) => {
  return history.map(msg => ({
    role: msg.role.toLowerCase() === 'assistant' ? 'assistant' : 'user',
    content: msg.message
  }));
};

// Controller: Get AI response from OpenAI GPT-4
export const getAIResponse = async (chatHistory) => {
  const input = formatChatHistoryForOpenAI(chatHistory);
  const response = await OpenAIClient.responses.create({
    model: "gpt-4.1",
    input
  });
  return response.output_text;
};

// Controller: Get full message history for a chat (for sockets)
export const getChatHistory = async (chatId) => {
  const chat = await Chat.findById(chatId);
  return chat ? chat.messageHistory : [];
};

// Controller: Add a new message to a chat and return the new message
export const addMessageToChat = async (chatId, { role, message }) => {
  const msg = {
    role,
    message,
    timestamp: new Date(),
  };
  const chat = await Chat.findById(chatId);
  if (chat) {
    chat.messageHistory.push(msg);
    chat.lastMessage = msg;
    await chat.save();
    return msg;
  }
  return null;
};


