import express from "express";
import { connectDB, ObjectId } from "../dbcont.js";

const router = express.Router();

// POST /api/orders – create a new order
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const { name, phone, lessonIDs, spaces } = req.body;

    if (!name || !phone || !Array.isArray(lessonIDs) || !Array.isArray(spaces)) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    const order = {
      name,
      phone,
      lessonIDs: lessonIDs.map((id) => new ObjectId(id)),
      spaces,
      createdAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(order);
    res.status(201).json({ ...order, _id: result.insertedId });
  } catch (err) {
    console.error("POST /api/orders error (full):", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// GET /api/orders – list all orders
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const orders = await db.collection("orders").find({}).toArray();
    res.json(orders);
  } catch (err) {
    console.error("GET /api/orders error (full):", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
