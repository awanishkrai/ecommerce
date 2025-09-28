const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { user, orderItems, shippingAddress, paymentMethod, totalPrice } =
      req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    const order = new Order({
      user: user || null, // Allow user to pass ID manually or leave null
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Order creation failed", error: error.message });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product", "name price image");

    if (order) {
      res.json(order); // No user ownership check
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @desc    Get all orders for a given user ID
// @route   GET /api/orders/myorders/list?userId=xxx
// @access  Public
router.get("/myorders/list", async (req, res) => {
  try {
    const userId = req.query.userId;
    const filter = userId ? { user: userId } : {};
    const orders = await Order.find(filter)
      .populate("orderItems.product", "name price image")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Public
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .populate("orderItems.product", "name price image")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Public
router.put("/:id/pay", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = "processing";

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @desc    Update order status (anyone can call this now)
// @route   PUT /api/orders/:id/status
// @access  Public
router.put("/:id/status", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = req.body.status || order.status;

      if (req.body.status === "delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
