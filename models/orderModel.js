import mongoose from "mongoose";

/**
 * Order item schema for individual items in an order.
 * @typedef {Object} OrderItem
 * @property {ObjectId} medicineId - Reference to the Medicine model.
 * @property {number} quantity - Quantity of the medicine ordered.
 * @property {number} unitPrice - Unit price of the medicine at the time of order.
 */

const orderItemSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
    required: [true, "Please provide a medicine ID!"],
  },
  quantity: {
    type: Number,
    required: [true, "Please provide a quntity!"],
    min: [1, "Quantity must be at least 1"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Please provide a unit price!"],
    min: [0, "Unit price cannot be negative"],
  },
});

/**
 * Order schema for the application.
 * @typedef {Object} Order
 * @property {ObjectId} customerId - Reference to the Patient/Customer model.
 * @property {OrderItem[]} orderItems - Array of order items.
 * @property {number} totalPrice - Total price of the order.
 * @property {'pending' | 'delivered' | 'cancelled'} [orderStatus='pending'] - Status of the order.
 * @property {Date} deliveryDate - Expected delivery date.
 * @property {string} shippingAddress - Shipping address for the order.
 */

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Please provide a customer ID!"],
    },
    orderItems: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: [true, "Please provide a total price!"],
      min: [0, "Total price cannot be negative"],
    },
    orderStatus: {
      type: String,
      enum: ["pending", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryDate: {
      type: Date,
      required: [true, "Please provide a delivery date!"],
    },
    shippingAddress: {
      type: String,
      required: [true, "Please provide a shipping address!"],
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
