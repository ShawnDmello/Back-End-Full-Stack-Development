import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "../dbcont.js";
import classroutes from "./routes/classRoutes.js";
import orderroutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();

// Ensure DB connects at startup (optional but useful for logs)
connectDB().catch((err) => {
  console.error("Initial MongoDB connection failed:", err);
});

// JSON body parser
app.use(express.json());

// CORS – allow your GitHub Pages frontend to call the API
app.use(
  cors({
    origin: "*", // or restrict to your GitHub Pages URL
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type"]
  })
);

// Logger middleware (coursework requirement)
app.use((req, res, next) => {
  console.log("----- NEW REQUEST -----");
  console.log("Time:", new Date().toLocaleString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Body:", req.body);
  console.log("------------------------");
  next();
});

// Static file middleware for lesson images (coursework requirement)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve images from /public (e.g. /public/maths.jpg)
app.use("/public", express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/classes", classroutes);
app.use("/api/orders", orderroutes);

// Simple health-check route
app.get("/", (req, res) => {
  res.send("Backend running with native MongoDB driver");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

