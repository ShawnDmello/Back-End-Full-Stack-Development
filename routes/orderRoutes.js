import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// POST - Save a new order into MongoDB
router.post("/", async (req, res) => {
  try {
    const newOrder = await Order.create(req.body);
    res.status(201).json({
      message: "Order saved successfully",
      order: newOrder
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET - View all saved orders (for testing)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
