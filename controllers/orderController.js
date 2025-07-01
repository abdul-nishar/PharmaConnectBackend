import Order from "../models/orderModel.js";
import Medicine from "../models/medicineModel.js";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create new order
export const createOrder = asyncHandler(async (req, res, next) => {
    const customerId = req.user._id;
    const { cart, address, deliveryDate } = req.body;

    // Validate and calculate total price
    let totalPrice = 0;
    const validatedItems = [];

    for (const item of cart) {
      const medicine = await Medicine.findById(item.id);

      if (!medicine) {
        return next(new AppError(`Medicine with ID ${item.id} not found`, 404))
      }

      totalPrice += medicine.price * item.qty;
      validatedItems.push({
        medicineId: medicine._id,
        quantity: item.qty,
        unitPrice: medicine.price,
      });
    }

    const order = new Order({
      customerId,
      orderItems: validatedItems,
      totalPrice,
      shippingAddress: address,
      deliveryDate:
        deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    const savedOrder = await order.save();

    await savedOrder.populate("orderItems.medicineId", "name price");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedOrder,
    });
});

// Get order by ID
export const getOrderById = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email")
      .populate("orderItems.medicineId", "name price image");

    if (!order) {
      return next(new AppError("Order not found", 404))
    }

    res.json({
      success: true,
      data: order,
    });

});

// Get all orders for a user
export const getUserOrders = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    let filter = { customerId: userId };
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate("orderItems.medicineId", "name price image")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

});

// Get all orders (admin only)
export const getAllOrders = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, status } = req.query;

    let filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate("customerId", "name email")
      .populate("orderItems.medicineId", "name price")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

});

// Update order status (admin only)
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ["pending", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return next(new AppError("Order not found", 404))
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });

});

// Cancel order
export const cancelOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError("Order not found", 404))
    }

    if (order.orderStatus === "delivered") {
      return next(new AppError("Cannot cancel delivered order", 400))
    }

    if (order.orderStatus === "cancelled") {
      return next(new AppError("Order Already cancelled", 400))
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
});
