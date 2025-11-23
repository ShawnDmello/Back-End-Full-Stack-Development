import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const uri = process.env.MONGO_URI; // Set this in Render
const client = new MongoClient("mongodb+srv://Shawn:CybWfAnBSRLxcvs6@webapplication.u2aepyi.mongodb.net/classDB?retryWrites=true&w=majority");

let db;

export async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      console.log("MongoDB Connected (native driver)");
      // Use your actual DB name here (the one you used in initial-data.js)
      db = client.db("classesdb");
    }
    return db;
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    throw error;
  }
}

export { ObjectId };
