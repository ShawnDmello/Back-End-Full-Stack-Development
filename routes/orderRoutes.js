import express from "express";
import { connectDB, ObjectId } from "../dbcont.js";

const router = express.Router();

// POST /api/orders – create a new order
router.post("/", async (req, res) => {
  console.log(">>> POST /api/orders hit");
  console.log("Request body:", req.body);

  try {
    const db = await connectDB();
    const { name, phone, lessonIDs, spaces } = req.body;

    if (!name || !phone || !Array.isArray(lessonIDs) || !Array.isArray(spaces)) {
      console.log("Invalid order data:", { name, phone, lessonIDs, spaces });
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
    console.log("Order inserted with _id:", result.insertedId);

    res.status(201).json({ ...order, _id: result.insertedId });
  } catch (err) {
    console.error("POST /api/orders error (full):", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;

