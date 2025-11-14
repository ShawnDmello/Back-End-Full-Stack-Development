import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./dbcont.js";
import classroutes from "./routes/classRoutes.js";
import orderroutes from "./routes/orderRoutes.js";
import { classes } from "../models/Class.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Content-Type"],
}));

// Routes
app.use("/api/classes", classroutes);
app.use("/api/orders", orderroutes);

// Root test route
app.get("/", (req, res) => {
  res.send("Backend running + MongoDB connected ✔️");
});

app.get("/lessons", (req, res) => {
  res.json({classes});
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
