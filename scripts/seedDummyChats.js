import mongoose from 'mongoose';
import Chat from '../models/chatModel.js';
import Patient from '../models/patientModel.js';
import Doctor from '../models/doctorModel.js';
import dotenv from 'dotenv';
dotenv.config();

const DUMMY_CHATS = [
  {
    title: 'General Discussion',
    lastMessage: { role: 'User', message: 'Welcome to the chat!', timestamp: new Date() },
    messageHistory: [
      { role: 'User', message: 'Welcome to the chat!', timestamp: new Date() }
    ]
  },
  {
    title: 'Order Support',
    lastMessage: { role: 'Assistant', message: 'How can I help you with your order?', timestamp: new Date() },
    messageHistory: [
      { role: 'Assistant', message: 'How can I help you with your order?', timestamp: new Date() }
    ]
  },
  {
    title: 'Prescription Help',
    lastMessage: { role: 'User', message: 'I need help with my prescription.', timestamp: new Date() },
    messageHistory: [
      { role: 'User', message: 'I need help with my prescription.', timestamp: new Date() }
    ]
  },
  {
    title: 'Pharmacy Info',
    lastMessage: { role: 'Assistant', message: 'Our pharmacy is open 9am-9pm.', timestamp: new Date() },
    messageHistory: [
      { role: 'Assistant', message: 'Our pharmacy is open 9am-9pm.', timestamp: new Date() }
    ]
  },
  {
    title: 'Feedback',
    lastMessage: { role: 'User', message: 'Great service!', timestamp: new Date() },
    messageHistory: [
      { role: 'User', message: 'Great service!', timestamp: new Date() }
    ]
  }
];

async function seedChatsAndAssign() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  // Remove all existing chats
  await Chat.deleteMany({});
  // Create dummy chats
  const createdChats = await Chat.insertMany(DUMMY_CHATS);
  const chatIds = createdChats.map(chat => chat._id);

  // Assign to all patients
  await Patient.updateMany({}, { $set: { chatIds } });
  // Assign to all doctors (if you want doctors to have these chats too)
  await Doctor.updateMany({}, { $set: { chatIds } });

  console.log('Dummy chats created and assigned to all users.');
  await mongoose.disconnect();
}

seedChatsAndAssign().catch(err => { console.error(err); process.exit(1); });
