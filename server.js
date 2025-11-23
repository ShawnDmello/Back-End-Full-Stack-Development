import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./dbcont.js";
import classroutes from "./routes/classRoutes.js";
import orderroutes from "./routes/orderRoutes.js";

dotenv.config();
const app = express();

// Connect to MongoDB once at startup (optional but nice)
connectDB().catch((err) => {
  console.error("Initial MongoDB connection failed:", err);
});

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type"],
  })
);

// Mount routes
app.use("/api/classes", classroutes);
app.use("/api/orders", orderroutes);

// Root test route
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
