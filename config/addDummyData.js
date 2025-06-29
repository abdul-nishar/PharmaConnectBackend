import { dummyDoctors } from "../utils/dummyData.js";
import mongoose from "mongoose";
import Doctor from "../models/doctorModel.js";

const MONGO_URI = "mongodb+srv://phadrohanvaijnath:MR7VinL9ZK3qjCwh@cluster0.wlpciy2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


const addData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Doctor.deleteMany();

    // Create dummy doctors
    const doctors = await Doctor.insertMany(dummyDoctors);

    console.log("Dummy data inserted successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

addData();
