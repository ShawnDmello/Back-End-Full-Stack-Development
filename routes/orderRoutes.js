import express from "express";
import { connectDB, ObjectId } from "../dbcont.js";

const router = express.Router();

// GET /api/orders – list all orders
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const orders = await db.collection("orders").find({}).toArray();
    return res.json(orders);
  } catch (err) {
    console.error("GET /api/orders error (full):", err);
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
      return res.status(400).json({ error: "Invalid order data" });
    }

    // Normalize spaces array: if not provided or length mismatch, default to 1 per lesson
    let spacesArr = Array.isArray(spaces) ? spaces.map(s => Number(s) || 1) : [];
    if (spacesArr.length !== lessonIDs.length) {
      spacesArr = lessonIDs.map(() => 1);
    }

    // Convert lessonIDs to ObjectId where necessary and build pairs
    const lessonPairs = lessonIDs.map((id, idx) => ({
      idStr: String(id),
      objectId: new ObjectId(String(id)),
      requested: Math.max(1, Number(spacesArr[idx]) || 1)
    }));

    // We'll keep track of successful decrements to allow rollback on failure
    const decremented = [];

    // For each lesson attempt conditional decrement
    for (const pair of lessonPairs) {
      const { objectId, requested, idStr } = pair;

      // Attempt to decrement only if enough availableInventory
      const result = await db.collection("classes").findOneAndUpdate(
        { _id: objectId, availableInventory: { $gte: requested } },
        { $inc: { availableInventory: -requested } },
        { returnDocument: "after" }
      );

      // If no document returned, not enough inventory (or class not found)
      if (!result.value) {
        console.log(`Not enough inventory for lesson ${idStr}, requested ${requested}`);
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
          error: `Not enough spots for class ${idStr} (requested ${requested}). Order not placed.`
        });
      }

      // success -> record it
      decremented.push({ objectId, requested });
      console.log(`Decremented ${requested} for lesson ${idStr}; remaining: ${result.value.availableInventory}`);
    }

    // All decrements succeeded -> insert the order document
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
    console.error("POST /api/orders error (full):", err);

    // If something unexpected happened, we should not leave partial decrements.
    // (This catch won't know which decrements happened; in practice you could track and roll back here.)
    return res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;
