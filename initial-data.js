// Initial lessons data to insert into MongoDB
// Run this script once to populate your database

const { MongoClient } = require('mongodb');

// Replace with your MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/';
const DB_NAME = 'classesdb';

const lessons = [
  { 
    title: "Mathematics Advanced", 
    description: "Advanced mathematics covering algebra, calculus and statistics", 
    price: 45.00, 
    image: "images/maths.jpg", 
    availableInventory: 10,
    rating: 5,
    category: "Maths",
    location: "London"
  },
  { 
    title: "English Literature", 
    description: "Classic and modern literature analysis and creative writing", 
    price: 35.00, 
    image: "images/eng.jpg", 
    availableInventory: 8,
    rating: 4,
    category: "English",
    location: "Manchester"
  },
  { 
    title: "Music Theory", 
    description: "Learn music notation, composition and harmony fundamentals",
    price: 40.00, 
    image: "images/music.png",
    availableInventory: 5,
    rating: 5,
    category: "Music",
    location: "Birmingham"
  },
  { 
    title: "World History", 
    description: "Explore ancient civilizations to modern world events",
    price: 38.00, 
    image: "images/history.jpg",
    availableInventory: 12,
    rating: 4,
    category: "History",
    location: "London"
  },
  { 
    title: "English Grammar", 
    description: "Master English grammar, punctuation and sentence structure",
    price: 30.00, 
    image: "images/lit.jfif",
    availableInventory: 15,
    rating: 4,
    category: "English",
    location: "Leeds"
  },
  { 
    title: "Music Performance", 
    description: "Practical music lessons for various instruments and vocals",
    price: 50.00, 
    image: "images/limp.jpg",
    availableInventory: 6,
    rating: 5,
    category: "Music",
    location: "Manchester"
  },
  { 
    title: "British History", 
    description: "Comprehensive study of British history from medieval to modern times",
    price: 42.00, 
    image: "images/british.jpg",
    availableInventory: 9,
    rating: 5,
    category: "History",
    location: "Birmingham"
  },
  { 
    title: "Mathematics GCSE", 
    description: "GCSE level mathematics preparation and practice",
    price: 35.00, 
    image: "images/gcse.png",
    availableInventory: 3,
    rating: 4,
    category: "Maths",
    location: "Leeds"
  }
];

async function insertData() {
  let client;
  
  try {
    // Connect to MongoDB
    client = await MongoClient.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Clear existing lessons (optional - comment out if you don't want to clear)
    await db.collection('lessons').deleteMany({});
    console.log('Cleared existing lessons');
    
    // Insert lessons
    const result = await db.collection('lessons').insertMany(lessons);
    console.log(`Inserted ${result.insertedCount} lessons`);
    
    // Display inserted lessons
    const insertedLessons = await db.collection('lessons').find({}).toArray();
    console.log('\nInserted lessons:');
    insertedLessons.forEach(lesson => {
      console.log(`- ${lesson.title} (${lesson.category}) - ${lesson.location} - £${lesson.price}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the script
insertData();
