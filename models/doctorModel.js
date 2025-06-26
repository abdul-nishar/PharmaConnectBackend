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
    enum: ['patient', 'patient'],
    default: 'patient',
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
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

/**
 * Pre-save middleware to hash the password.
 * @param {Function} next - Callback function to pass control to the next middleware.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

/**
 * Pre-save middleware to set passwordChangedAt if password was modified.
 * @param {Function} next - Callback function to pass control to the next middleware.
 */
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/**
 * Method to verify if the provided password matches the stored password.
 * @param {string} candidatePassword - The password provided by the user.
 * @param {string} userPassword - The stored hashed password.
 * @returns {Promise<boolean>} - Whether the passwords match.
 */
userSchema.methods.passwordVerification = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * Method to check if the password was changed after a specific JWT token's timestamp.
 * @param {number} JWTTimestamp - The timestamp from the JWT token.
 * @returns {boolean} - Whether the password was changed after the token was issued.
 */
userSchema.methods.passwordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTime = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTime;
  }
  return false;
};

/**
 * Method to create a password reset token and store it in the user document.
 * @returns {string} - The password reset token.
 */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

/**
 * Pre-query middleware to filter out inactive users.
 * @param {Function} next - Callback function to pass control to the next middleware.
 */
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

const Patient = mongoose.model('User', patientSchema);

export default Patient;