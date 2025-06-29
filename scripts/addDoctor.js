import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/doctorModel.js';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = `doctor@example.com`;
  const password = 'TestPassword123';
  const doctor = new Doctor({
    name: 'Dr. Test',
    email,
    password,
    passwordConfirm: password,
    specialization: 'General Medicine'
  });
  await doctor.save();
  console.log('Doctor created:');
  console.log('Email:', email);
  console.log('Password:', password);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
