import Chat from '../models/chatModel.js';

export const createChat = async (data) => {
  const chat = new Chat(data);
  return await chat.save();
};

export const addMessage = async (chatId, msg) => {
  const chat = await Chat.findById(chatId);
  if (chat) {
    chat.messageHistory.push(msg);
    chat.lastMessage = msg;
    await chat.save();
    return msg;
  }
};
