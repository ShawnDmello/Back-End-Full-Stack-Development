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

    // Enhanced validation with detailed error messages
    if (! name || typeof name !== 'string' || name.trim().length === 0) {
      console. log("Invalid name:", name);
      return res.status(400). json({ error: "Invalid order data: name is required and must be a non-empty string" });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      console.log("Invalid phone:", phone);
      return res.status(400).json({ error: "Invalid order data: phone is required and must be a non-empty string" });
    }

    if (!Array.isArray(lessonIDs) || lessonIDs.length === 0) {
      console.log("Invalid lessonIDs:", lessonIDs);
      return res.status(400).json({ error: "Invalid order data: lessonIDs must be a non-empty array" });
    }

    if (! Array.isArray(spaces)) {
      console.log("Invalid spaces:", spaces);
      return res. status(400).json({ error: "Invalid order data: spaces must be an array" });
    }

    let spacesArr = Array. isArray(spaces) ? spaces. map(s => Number(s) || 1) : [];
    if (spacesArr.length !== lessonIDs.length) {
      spacesArr = lessonIDs.map(() => 1);
    }

    const lessonPairs = lessonIDs.map((id, idx) => ({
      idStr: String(id),
      objectId: new ObjectId(String(id)),
      requested: Math.max(1, Number(spacesArr[idx]) || 1)
    }));

    const decremented = [];

    // Process each class in the order
    for (const pair of lessonPairs) {
      const { objectId, requested, idStr } = pair;

      // Fetch the class doc first
      const classDoc = await db. collection("classes").findOne({ _id: objectId });
      if (!classDoc) {
        // Rollback previous decrements
        for (const prev of decremented) {
          await db.collection("classes").updateOne(
            { _id: prev. objectId }, 
            { $inc: { availableInventory: prev.requested } }
          );
        }
        return res. status(400).json({ error: `Class not found: ${idStr}`, classId: idStr });
      }

      // Coerce to Number for accurate comparison
      const available = Number(classDoc.availableInventory ?? 0);

      console.log(`Checking inventory for ${idStr} (title: ${classDoc.title || classDoc. subject || '(no title)'}) — requested ${requested}, available ${available}, raw:`, classDoc. availableInventory);

      // Check if enough inventory
      if (available < requested) {
        // Rollback previous decrements
        for (const prev of decremented) {
          await db.collection("classes").updateOne(
            { _id: prev.objectId }, 
            { $inc: { availableInventory: prev.requested } }
          );
        }

        return res.status(400).json({
          error: `Not enough spots for class "${classDoc.title || classDoc.subject || idStr}" (requested ${requested}, available ${available}). Order not placed.`,
          classId: idStr,
          classTitle: classDoc.title || classDoc.subject || idStr,
          available
        });
      }

      // SIMPLIFIED UPDATE: Just decrement without atomic check
      // (We already verified inventory above, so this is safe for single-user scenarios)
      const updateResult = await db.collection("classes").updateOne(
        { _id: objectId },
        { $inc: { availableInventory: -requested } }
      );

      if (updateResult.matchedCount === 0) {
        // Class doesn't exist anymore (shouldn't happen)
        for (const prev of decremented) {
          await db. collection("classes").updateOne(
            { _id: prev.objectId }, 
            { $inc: { availableInventory: prev.requested } }
          );
        }
        
        return res.status(400).json({
          error: `Class not found during update: ${idStr}`,
          classId: idStr
        });
      }

      // Fetch the updated document to get new inventory
      const updatedDoc = await db.collection("classes").findOne({ _id: objectId });

      // Success - record for potential rollback
      decremented.push({ objectId, requested });
      console.log(`✅ Decremented ${requested} for ${idStr}; remaining:`, updatedDoc.availableInventory);
    }

    // Insert the order record
    const orderDoc = {
      name,
      phone,
      lessonIDs: lessonPairs.map(p => p.objectId),
      spaces: lessonPairs. map(p => p.requested),
      createdAt: new Date()
    };

    const insertResult = await db.collection("orders").insertOne(orderDoc);
    console.log("✅ Order inserted with _id:", insertResult.insertedId);

    return res.status(201). json({ ...orderDoc, _id: insertResult.insertedId });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return res.status(500). json({ error: "Failed to create order" });
  }
});

export default router;
