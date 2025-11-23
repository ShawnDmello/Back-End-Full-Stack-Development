import express from "express";
import { connectDB, ObjectId } from "../dbcont.js";

const router = express.Router();

// GET /api/classes – return all classes from WebApp.classes
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const classes = await db.collection("classes").find({}).toArray();
    res.json(classes);
  } catch (err) {
    console.error("GET /api/classes error (full):", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

// PUT /api/classes/:id – update any fields on a class (e.g. spaces)
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const update = req.body; // e.g. { space: 3 } or { availableInventory: 4 }

    const result = await db.collection("classes").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    res.json({ message: "Class updated" });
  } catch (err) {
    console.error("PUT /api/classes/:id error (full):", err);
    res.status(500).json({ error: "Failed to update class" });
  }
});

export default router;
