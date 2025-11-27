// routes/orderRoutes.js
// Replace or add this route to improve order handling: clearer errors and rollback on partial decrements.

import express from "express";
import { connectDB, ObjectId } from "../dbcont.js";

const router = express.Router();

// GET /api/orders – list all orders (optional)
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const orders = await db.collection("orders").find({}).toArray();
    return res.json(orders);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// POST /api/orders – create a new order and decrement inventory
router.post("/", async (req, res) => {
  console.log(">>> POST /api/orders hit");
  console.log("Request body:", req.body);

  try {
    const db = await connectDB();
    const { name, phone, lessonIDs, spaces } = req.body;

    // Basic validation
    if (!name || !phone || !Array.isArray(lessonIDs) || lessonIDs.length === 0) {
      console.log("Invalid order data:", { name, phone, lessonIDs, spaces });
      return res.status(400).json({ error: "Invalid order data: name, phone and lessonIDs are required" });
    }

    // Normalize spaces array
    let spacesArr = Array.isArray(spaces) ? spaces.map(s => Number(s) || 1) : [];
    if (spacesArr.length !== lessonIDs.length) {
      spacesArr = lessonIDs.map(() => 1);
    }

    // Build lesson pairs
    const lessonPairs = lessonIDs.map((id, idx) => ({
      idStr: String(id),
      objectId: new ObjectId(String(id)),
      requested: Math.max(1, Number(spacesArr[idx]) || 1)
    }));

    const decremented = [];

    // Try to decrement each class atomically (conditional update)
    for (const pair of lessonPairs) {
      const { objectId, requested, idStr } = pair;

      const result = await db.collection("classes").findOneAndUpdate(
        { _id: objectId, availableInventory: { $gte: requested } },
        { $inc: { availableInventory: -requested } },
        { returnDocument: "after" }
      );

      if (!result.value) {
        // Not enough inventory (or class missing). Try to fetch class doc for nicer message
        let classDoc = null;
        try {
          classDoc = await db.collection("classes").findOne({ _id: objectId });
        } catch (e) {
          console.error("Error fetching class doc for error message:", e);
        }

        const title = classDoc ? (classDoc.title || classDoc.subject || String(idStr)) : String(idStr);
        const available = classDoc ? (classDoc.availableInventory ?? 0) : 0;

        console.log(`Not enough inventory for lesson ${idStr} (title: ${title}), requested ${requested}, available ${available}`);

        // Rollback previous decrements
        for (const prev of decremented) {
          try {
            await db.collection("classes").updateOne(
              { _id: prev.objectId },
              { $inc: { availableInventory: prev.requested } }
            );
            console.log(`Rolled back ${prev.requested} for lesson ${String(prev.objectId)}`);
          } catch (rbErr) {
            console.error("Rollback error:", rbErr);
          }
        }

        return res.status(400).json({
          error: `Not enough spots for class "${title}" (requested ${requested}, available ${available}). Order not placed.`,
          classId: idStr,
          classTitle: title,
          available
        });
      }

      decremented.push({ objectId, requested });
      console.log(`Decremented ${requested} for lesson ${idStr}; remaining: ${result.value.availableInventory}`);
    }

    // All decrements successful -> insert order doc
    const orderDoc = {
      name,
      phone,
      lessonIDs: lessonPairs.map(p => p.objectId),
      spaces: lessonPairs.map(p => p.requested),
      createdAt: new Date()
    };

    const insertResult = await db.collection("orders").insertOne(orderDoc);
    console.log("Order inserted with _id:", insertResult.insertedId);

    // Return created order (with _id) to client
    return res.status(201).json({ ...orderDoc, _id: insertResult.insertedId });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;
