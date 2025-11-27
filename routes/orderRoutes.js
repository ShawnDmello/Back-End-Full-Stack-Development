import express from "express";
import { connectDB, ObjectId } from "../dbcont.js";

const router = express.Router();

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

router.post("/", async (req, res) => {
  console.log(">>> POST /api/orders hit");
  console.log("Request body:", req.body);

  try {
    const db = await connectDB();
    const { name, phone, lessonIDs, spaces } = req.body;

    if (!name || !phone || !Array.isArray(lessonIDs) || lessonIDs.length === 0) {
      console.log("Invalid order data:", { name, phone, lessonIDs, spaces });
      return res.status(400).json({ error: "Invalid order data: name, phone and lessonIDs are required" });
    }

    let spacesArr = Array.isArray(spaces) ? spaces.map(s => Number(s) || 1) : [];
    if (spacesArr.length !== lessonIDs.length) {
      spacesArr = lessonIDs.map(() => 1);
    }

    const lessonPairs = lessonIDs.map((id, idx) => ({
      idStr: String(id),
      objectId: new ObjectId(String(id)),
      requested: Math.max(1, Number(spacesArr[idx]) || 1)
    }));

    const decremented = [];

    for (const pair of lessonPairs) {
      const { objectId, requested, idStr } = pair;

      // Fetch the class doc first and coerce availableInventory to a Number
      const classDoc = await db.collection("classes").findOne({ _id: objectId });
      if (!classDoc) {
        // rollback previous decrements
        for (const prev of decremented) {
          await db.collection("classes").updateOne({ _id: prev.objectId }, { $inc: { availableInventory: prev.requested } });
        }
        return res.status(400).json({ error: `Class not found: ${idStr}`, classId: idStr });
      }

      // Coerce stored value to Number for accurate comparison
      const available = Number(classDoc.availableInventory ?? 0);

      console.log(`Checking inventory for ${idStr} (title: ${classDoc.title || classDoc.subject || '(no title)'}) — requested ${requested}, available (coerced) ${available}, raw:`, classDoc.availableInventory);

      if (available < requested) {
        // rollback previous decrements
        for (const prev of decremented) {
          await db.collection("classes").updateOne({ _id: prev.objectId }, { $inc: { availableInventory: prev.requested } });
        }

        return res.status(400).json({
          error: `Not enough spots for class "${classDoc.title || classDoc.subject || idStr}" (requested ${requested}, available ${available}). Order not placed.`,
          classId: idStr,
          classTitle: classDoc.title || classDoc.subject || idStr,
          available
        });
      }

      // Attempt atomic decrement; this still guards against races
      const result = await db.collection("classes").findOneAndUpdate(
        { _id: objectId, availableInventory: { $gte: requested } },
        { $inc: { availableInventory: -requested } },
        { returnDocument: "after" }
      );

      if (!result.value) {
        // If conditional update failed, someone else likely took spots in the meantime.
        // Rollback previous decrements
        for (const prev of decremented) {
          await db.collection("classes").updateOne({ _id: prev.objectId }, { $inc: { availableInventory: prev.requested } });
        }

        // Re-fetch to show current availability
        const latest = await db.collection("classes").findOne({ _id: objectId });
        const latestAvailable = Number(latest?.availableInventory ?? 0);
        return res.status(400).json({
          error: `Not enough spots for class "${latest?.title || latest?.subject || idStr}" (requested ${requested}, available ${latestAvailable}). Order not placed.`,
          classId: idStr,
          classTitle: latest?.title || latest?.subject || idStr,
          available: latestAvailable
        });
      }

      // success -> record for potential rollback
      decremented.push({ objectId, requested });
      console.log(`Decremented ${requested} for ${idStr}; remaining (after):`, result.value.availableInventory);
    }

    // Insert the order record
    const orderDoc = {
      name,
      phone,
      lessonIDs: lessonPairs.map(p => p.objectId),
      spaces: lessonPairs.map(p => p.requested),
      createdAt: new Date()
    };

    const insertResult = await db.collection("orders").insertOne(orderDoc);
    console.log("Order inserted with _id:", insertResult.insertedId);

    return res.status(201).json({ ...orderDoc, _id: insertResult.insertedId });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;
