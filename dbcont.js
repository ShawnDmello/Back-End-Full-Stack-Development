const { MongoClient, ObjectId } = require('mongodb');
 
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
 
let db; // cached DB handle
 
async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db('WebApplication'); 
  console.log('Connections to MongoDB established');
  return db;
}
 
module.exports = { connectDB, ObjectId };