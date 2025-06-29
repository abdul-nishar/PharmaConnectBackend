import Chat from "../models/chatModel.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";
import ai from "../utils/aiClient.js";

// Controller for chat summaries
export const getChatSummaries = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching chat summaries",
      error: error.message,
    });
  }
};

// GET /api/chat/:chatId/messages - Returns message history for a specific chat, only if user has access
export const getChatMessages = async (req, res) => {
  try {
    const user = req.user;
    const chatId = req.params.chatId;
    const chatIds = user.chatIds || [];
    // Check if user has access to this chat
    if (!chatIds.map((id) => id.toString()).includes(chatId)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this chat." });
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found." });
    }
    res.json({ success: true, data: chat.messageHistory });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching chat messages",
      error: error.message,
    });
  }
};

// Helper: Format chat history for Gemini API
const formatChatHistoryForGemini = (history) => {
  // Gemini expects a single string or array of messages
  // We'll join messages for context
  return history.map((msg) => `${msg.role}: ${msg.message}`).join("\n");
};

// Controller: Get AI response from Gemini
export const getAIResponse = async (chatHistory) => {
  // import ai from openaiClient.js (now Gemini)
  const contents = formatChatHistoryForGemini(chatHistory);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: `You are a Medical Assistant. You only respond to medical queries 
      and provide assistance related to healthcare. Do not engage in any other topics. 
      Listen the user carefully and give a preliminary diagnosis. 
      If the user asks about something outside of healthcare, politely 
      redirect them back to medical topics. If the diagnosis is not clear, 
      ask for more information. 
      If the diagnosis is serious, suggest they see a doctor.
      Keep the response concise and focused on the medical issue.`,
    },
  });
  return response.text;
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
      return res.status(400).json({
        success: false,
        message: "Title and systemMessage are required.",
      });
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
    if (user.role === "patient") {
      await Patient.findByIdAndUpdate(user._id, {
        $push: { chatIds: chat._id },
      });
    } else if (user.role === "doctor") {
      await Doctor.findByIdAndUpdate(user._id, {
        $push: { chatIds: chat._id },
      });
    }
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating chat",
      error: error.message,
    });
  }
};

// Controller: Delete a chat and remove its reference from user's chatIds
export const deleteChat = async (req, res) => {
  try {
    const user = req.user;
    const chatId = req.params.chatId;
    // Check if user has access to this chat
    const chatIds = user.chatIds || [];
    if (!chatIds.map((id) => id.toString()).includes(chatId)) {
      return res.status(403).json({ success: false, message: "Access denied to this chat." });
    }
    // Remove chat from DB
    await Chat.findByIdAndDelete(chatId);
    // Remove chatId from user's chatIds
    if (user.role === "patient") {
      await Patient.findByIdAndUpdate(user._id, { $pull: { chatIds: chatId } });
    } else if (user.role === "doctor") {
      await Doctor.findByIdAndUpdate(user._id, { $pull: { chatIds: chatId } });
    }
    res.json({ success: true, message: "Chat deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting chat", error: error.message });
  }
};
