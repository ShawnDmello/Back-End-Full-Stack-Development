import express from "express";
import { orders } from "../data/orders.js";

const router = express.Router();

// CREATE new order
router.post("/", (req, res) => {
  const newOrder = { id: Date.now(), ...req.body };
  orders.push(newOrder);
  res.json({ message: "Order saved", order: newOrder });
});

// GET all orders
router.get("/", (req, res) => {
  res.json(orders);
});

export default router;
