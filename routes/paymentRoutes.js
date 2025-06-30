// routes/payment.js
import express from "express";
import Stripe from "stripe";
import Order from "../models/orderModel.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_BACKEND_SECRET);
const FRONTEND_URL = process.env.FRONTEND_URL

router.post("/create-checkout-session", async (req, res) => {
  const { orderData } = req.body;
  const paymentMethodTypes = ["card"];

  console.log(orderData);

  let lineItems = [];

  try {
    // If orderData with cart is provided, use it to create line items
    if (orderData && orderData.cart && orderData.cart.length > 0) {
      lineItems = orderData.cart.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name,
            description: item.description || `Medicine: ${item.name}`,
          },
          unit_amount: Math.round(item.price * 100), // Convert to paise
        },
        quantity: item.qty || 1,
      }));
    }

    console.log(`${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`);


    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: lineItems,
      mode: "payment",
      success_url:
        `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cancel`,
      metadata: {
        // Store order information in metadata
        orderId: orderData?.orderId || "",
        address: orderData?.address || "",
        orderTotal: orderData?.total?.toString() || "",
        customerEmail: orderData?.customerEmail || "",
      },
    });

    res.send({ id: session.id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Handle payment success
router.get("/success/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Update order status in database
      const orderId = session.metadata.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          orderStatus: "confirmed",
          paymentStatus: "paid",
          stripeSessionId: sessionId,
        });
      }

      res.json({
        success: true,
        message: "Payment successful",
        orderId: orderId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
});

export default router;
