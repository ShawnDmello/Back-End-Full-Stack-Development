import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("ERROR: MONGO_URI environment variable is not set");
}

const client = new MongoClient(uri);

let db;

export async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      console.log("MongoDB Connected (native driver)");

      // IMPORTANT: use the DB which contains your real data
      // From your screenshot, your classes and orders are in WebApp
      db = client.db("WebApp");
    }
    return db;
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    throw error;
  }
}

export { ObjectId };
