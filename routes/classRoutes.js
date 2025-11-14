import express from "express";
import { classes } from "../models/Class.js";

const router = express.Router();

// GET all classes
router.get("/", (req, res) => {
  res.json(classes);
});

// ADD new class
router.post("/", (req, res) => {
  const newClass = { id: Date.now(), ...req.body };
  classes.push(newClass);
  res.json(newClass);
});

export default router;
