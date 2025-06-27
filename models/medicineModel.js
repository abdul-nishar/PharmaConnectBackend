import mongoose from 'mongoose';

const { Schema } = mongoose;

const medicineSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  shortDesc: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'General'
  }
}, {
  timestamps: true
});

export default mongoose.model('Medicine', medicineSchema);
