import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  image: String,
  availableInventory: Number,
  rating: Number,
  category: String,
  location: String
});

export default mongoose.model("Class", classSchema);
