import Chat from '../models/chatModel.js';
import OpenAIClient from '../utils/openaiClient.js';
import Patient from '../models/patientModel.js';
import Doctor from '../models/doctorModel.js';

// Controller for chat summaries
export const getChatSummaries = async (req, res) => {
  try {
    const user = req.user;
    const chatIds = user.chatIds || [];
    if (!chatIds.length) {
      return res.json({ success: true, data: [] });
    }
    // Fetch only chats the user is a part of
    const chats = await Chat.find({ _id: { $in: chatIds } }, 'title lastMessage messageHistory').sort({'lastMessage.timestamp': -1});
    const summaries = chats.map(chat => ({
      id: chat._id,
      title: chat.title,
      lastMessage: chat.lastMessage || null,
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
  console.log("Generating AI response for chat history:", chatHistory);
  const input = formatChatHistoryForOpenAI(chatHistory);
  console.log("Formatted input for OpenAI:", input);
  const response = await OpenAIClient.responses.create({
    model: "gpt-4.1",
    input
  });
  console.log("OpenAI response received:", response);
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

// Controller: Create a new chat and assign to user
export const createNewChat = async (req, res) => {
  try {
    const { title, systemMessage } = req.body;
    const user = req.user;
    if (!title || !systemMessage) {
      return res.status(400).json({ success: false, message: 'Title and systemMessage are required.' });
    }
    // Create initial system message
    const initialMsg = {
      role: 'System',
      message: systemMessage,
      timestamp: new Date()
    };
    // Create chat
    const chat = new Chat({
      title,
      lastMessage: initialMsg,
      messageHistory: [initialMsg]
    });
    await chat.save();
    // Add chatId to user's chatIds
    if (user.role === 'patient') {
      await Patient.findByIdAndUpdate(user._id, { $push: { chatIds: chat._id } });
    } else if (user.role === 'doctor') {
      await Doctor.findByIdAndUpdate(user._id, { $push: { chatIds: chat._id } });
    }
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating chat', error: error.message });
  }
};


