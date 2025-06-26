import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

/**
 * Doctor schema for the application.
 * @typedef {Object} Doctor
 * @property {string} name - The name of the patient.
 * @property {email} email - The email of the patient
 * @property {'patient' | 'doctor'} [role='doctor'] - The role of the user, either 'patient' or 'doctor'.
 * @property {string} password - The password of the patient.
 */

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please tell us your email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email address'],
  },
  role: {
    type: String,
    enum: ['patient', 'doctor'],
    default: 'doctor',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password!'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match',
    },
  },
  specialization: {
    type: String,
    required: [true, "Please provide a specialization."],
  },
  appointmentIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    }
],
});

/**
 * Pre-save middleware to hash the password.
 * @param {Function} next - Callback function to pass control to the next middleware.
 */
doctorSchema.pre('save', async function (next) {
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

/**
 * Method to verify if the provided password matches the stored password.
 * @param {string} candidatePassword - The password provided by the user.
 * @param {string} userPassword - The stored hashed password.
 * @returns {Promise<boolean>} - Whether the passwords match.
 */
doctorSchema.methods.passwordVerification = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;