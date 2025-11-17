import express from "express";
import Class from "../models/Class.js";  // Mongoose model

const router = express.Router();

// GET all classes from MongoDB
router.get("/", async (req, res) => {
  try {
    const allClasses = await Class.find(); 
    res.json(allClasses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// ADD new class to MongoDB
router.post("/", async (req, res) => {
  try {
    const newClass = new Class(req.body);
    await newClass.save();
    res.json(newClass);
  } catch (err) {
    res.status(500).json({ error: "Failed to create class" });
  }
});

export default router;
