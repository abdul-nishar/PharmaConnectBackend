import { getChatHistory, addMessageToChat, getAIResponse } from "../controllers/chatController.js";

export default function handleSocket(io) {
  io.on("connection", (socket) => {
    // Join a chat room and send full message history
    socket.on("joinChat", async ({ chatId }) => {
      socket.join(chatId);
      const history = await getChatHistory(chatId);
      // Send as { messageHistory: [...] }
      socket.emit("chatHistory", { messageHistory: history });
    });

    // Handle new message and broadcast to room
    socket.on("newMessage", async ({ chatId, role, message }) => {
      const msg = await addMessageToChat(chatId, { role, message });
      if (msg) {
        // Only emit the new message to all in the room
        io.to(chatId).emit("message", msg);
        // If the message is from a user, get AI response and emit
        if (role.toLowerCase() === 'user') {
          try {
            const history = await getChatHistory(chatId); // get updated history for AI
            const aiResponse = await getAIResponse(history);
            const aiMsg = await addMessageToChat(chatId, { role: 'Assistant', message: aiResponse });
            if (aiMsg) {
              io.to(chatId).emit("message", aiMsg);
            }
          } catch (err) {
            console.error("Error getting AI response:", err);
            socket.emit("message", { role: 'Assistant', message: 'Sorry, I could not get a response from the AI.' });
          }
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}
