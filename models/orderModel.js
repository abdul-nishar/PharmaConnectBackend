import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema({
  medicineId: {
    type: Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  orderItems: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  shippingAddress: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
