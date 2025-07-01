import Chat from "../models/chatModel.js";
import Patient from "../models/patientModel.js";
import genAI from "../utils/aiClient.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";

// Controller for chat summaries
export const getChatSummaries = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const chatIds = user.chatIds || [];
    if (!chatIds.length) {
      return res.json({ success: true, data: [] });
    }
    // Fetch only chats the user is a part of
    const chats = await Chat.find(
      { _id: { $in: chatIds } },
      "title lastMessage messageHistory"
    ).sort({ "lastMessage.timestamp": -1 });
    const summaries = chats.map((chat) => ({
      id: chat._id,
      title: chat.title,
      lastMessage: chat.lastMessage || null,
      timestamp: chat.lastMessage?.timestamp || null,
    }));
    res.json({ success: true, data: summaries });
});

// GET /api/chat/:chatId/messages - Returns message history for a specific chat, only if user has access
export const getChatMessages = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const chatId = req.params.chatId;
    const chatIds = user.chatIds || [];
    // Check if user has access to this chat
    if (!chatIds.map((id) => id.toString()).includes(chatId)) {
      return next(new AppError("Access denied to this chat.", 403))
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return next(new AppError("Chat not found.", 404))
    }
    res.json({ success: true, data: chat.messageHistory });
});

// Helper: Format chat history for Gemini API
const formatChatHistoryForGemini = (history) => {
  // Gemini expects a single string or array of messages
  // We'll join messages for context
  return history.map((msg) => `${msg.role}: ${msg.message}`).join("\n");
};

// Controller: Get AI response from Gemini
export const getAIResponse = async (chatHistory) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const systemInstruction = `You are a Medical Assistant. You only respond to medical queries 
    and provide assistance related to healthcare. Do not engage in any other topics. 
    Listen the user carefully and give a preliminary diagnosis. 
    If the user asks about something outside of healthcare, politely 
    redirect them back to medical topics. If the diagnosis is not clear, 
    ask for more information. 
    If the diagnosis is serious, suggest they see a doctor.
    Keep the response concise and focused on the medical issue.`;

    const contents = formatChatHistoryForGemini(chatHistory);
    const prompt = `${systemInstruction}\n\nConversation:\n${contents}\n\nResponse:`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
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
export const createNewChat = asyncHandler(async (req, res, next) => {
    const { title, systemMessage } = req.body;
    const user = req.user;
    if (!title || !systemMessage) {
      return next(new AppError("Title and systemMessage are required.", 400))
    }
    // Create initial system message
    const initialMsg = {
      role: "System",
      message: systemMessage,
      timestamp: new Date(),
    };
    // Create chat
    const chat = new Chat({
      title,
      lastMessage: initialMsg,
      messageHistory: [initialMsg],
    });
    await chat.save();
    // Add chatId to user's chatIds
    await Patient.findByIdAndUpdate(user._id, {
      $push: { chatIds: chat._id },
    });

    res.status(201).json({ success: true, data: chat });

});

// Controller: Delete a chat and remove its reference from user's chatIds
export const deleteChat = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const chatId = req.params.chatId;
    // Check if user has access to this chat
    const chatIds = user.chatIds || [];
    if (!chatIds.map((id) => id.toString()).includes(chatId)) {
      return next(new AppError("Access denied to this chat.", 403))
    }
    // Remove chat from DB
    await Chat.findByIdAndDelete(chatId);
    // Remove chatId from user's chatIds
    await Patient.findByIdAndUpdate(user._id, { $pull: { chatIds: chatId } });

    res.json({ success: true, message: "Chat deleted successfully." });
});
