import express from "express";
import { connectDB, ObjectId } from "../dbcont.js";

const router = express.Router();

// GET /api/classes  – return all lessons
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const lessons = await db.collection("lessons").find({}).toArray();
    res.json(lessons);
  } catch (err) {
    console.error("GET /api/classes error:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

// POST /api/classes  – (optional) create a new lesson if you need it
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const newLesson = req.body;

    const result = await db.collection("lessons").insertOne(newLesson);
    res.status(201).json({ ...newLesson, _id: result.insertedId });
  } catch (err) {
    console.error("POST /api/classes error:", err);
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

// PUT /api/classes/:id – update any fields on a lesson (esp. spaces)
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const update = req.body; // e.g. { space: 3 } or { availableInventory: 4 }

    const result = await db.collection("lessons").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json({ message: "Lesson updated" });
  } catch (err) {
    console.error("PUT /api/classes/:id error:", err);
    res.status(500).json({ error: "Failed to update lesson" });
  }
});

export default router;
