// Import required modules
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection string (replace with your MongoDB Atlas connection string)
const MONGODB_URI = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/';
const DB_NAME = 'classesdb';

// MongoDB client
let db;

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
  })
  .catch(error => console.error('MongoDB connection error:', error));

// =============== MIDDLEWARE ===============

// Enable CORS (allows front-end to connect)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Logger middleware - logs all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request Body:', req.body);
  console.log('Query Parameters:', req.query);
  console.log('---');
  next();
});

// Static file middleware - serves images from 'public' folder
app.use('/images', express.static(path.join(__dirname, 'public'), {
  fallthrough: false
}), (err, req, res, next) => {
  if (err) {
    res.status(404).json({ error: 'Image not found' });
  }
});

// =============== API ROUTES ===============

// GET route - Get all lessons
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// POST route - Create new order
app.post('/orders', async (req, res) => {
  try {
    const { name, phone, lessonIDs, spaces } = req.body;
    
    // Validate required fields
    if (!name || !phone || !lessonIDs || !spaces) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create order object
    const order = {
      name: name,
      phone: phone,
      lessonIDs: lessonIDs,
      spaces: spaces,
      orderDate: new Date()
    };
    
    // Insert order into database
    const result = await db.collection('orders').insertOne(order);
    
    res.json({
      message: 'Order created successfully',
      orderId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT route - Update lesson spaces
app.put('/lessons/:id', async (req, res) => {
  try {
    const lessonId = req.params.id;
    const { space } = req.body;
    
    // Validate space value
    if (space === undefined || space < 0) {
      return res.status(400).json({ error: 'Invalid space value' });
    }
    
    // Update lesson space
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: { availableInventory: space } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json({
      message: 'Lesson space updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// GET route - Search lessons (CHALLENGE COMPONENT)
app.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Search in multiple fields using regex
    const lessons = await db.collection('lessons').find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    }).toArray();
    
    res.json(lessons);
  } catch (error) {
    console.error('Error searching lessons:', error);
    res.status(500).json({ error: 'Failed to search lessons' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Online Classes API',
    endpoints: {
      'GET /lessons': 'Get all lessons',
      'POST /orders': 'Create new order',
      'PUT /lessons/:id': 'Update lesson spaces',
      'GET /search?q=query': 'Search lessons'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
