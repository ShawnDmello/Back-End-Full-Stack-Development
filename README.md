# Backend Setup Guide - Online Classes API

##  Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Git
- Postman (for testing)

##  Setup Instructions

### 1. MongoDB Atlas Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a **FREE cluster**
4. Click "Connect" → "Connect your application"
5. Copy your connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
6. **IMPORTANT:** Replace `<password>` with your actual password in the connection string

### 2. Local Setup

```bash
# Create backend folder
mkdir online-classes-backend
cd online-classes-backend

# Initialize npm and install dependencies
npm init -y
npm install express mongodb cors
npm install --save-dev nodemon

# Create necessary files (copy code from artifacts)
# - server.js
# - package.json
# - initial-data.js
# - .gitignore

# Create public folder for images
mkdir public
```

### 3. Configure MongoDB Connection

**Edit `server.js` and `initial-data.js`:**

Replace this line:
```javascript
const MONGODB_URI = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/';
```

With your actual MongoDB Atlas connection string.

### 4. Populate Database with Initial Data

```bash
node initial-data.js
```

You should see output like:
```
Connected to MongoDB
Cleared existing lessons
Inserted 8 lessons
- Mathematics Advanced (Maths) - London - £45
...
Database connection closed
```

### 5. Run Server Locally

```bash
# Start server
npm start

# Or use nodemon for auto-restart during development
npm run dev
```

Server should start on: `http://localhost:3000`

### 6. Test API with Postman

**Test 1: GET all lessons**
- Method: GET
- URL: `http://localhost:3000/lessons`
- Expected: JSON array of all lessons

**Test 2: POST new order**
- Method: POST
- URL: `http://localhost:3000/orders`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "lessonIDs": ["lesson_id_1", "lesson_id_2"],
  "spaces": [2, 1]
}
```

**Test 3: PUT update lesson spaces**
- Method: PUT
- URL: `http://localhost:3000/lessons/LESSON_ID_HERE`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "space": 8
}
```
(Replace `LESSON_ID_HERE` with actual MongoDB ObjectId from GET /lessons)

**Test 4: GET search lessons**
- Method: GET
- URL: `http://localhost:3000/search?q=maths`
- Expected: Lessons matching "maths"

##  Deploy to Render.com

### 1. Create GitHub Repository

```bash
# Initialize git
git init
git add .
git commit -m "Initial backend setup"

# Create repository on GitHub
# Then push code
git remote add origin https://github.com/YOUR_USERNAME/online-classes-backend.git
git branch -M main
git push -u origin main
```

**IMPORTANT:** Make at least 10 commits with meaningful messages!

### 2. Deploy on Render.com

1. Go to https://render.com
2. Sign up/Login (can use GitHub)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** online-classes-api
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
6. Add Environment Variable:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string
7. Click "Create Web Service"

Wait 5-10 minutes for deployment. You'll get a URL like:
`https://online-classes-api.onrender.com`

### 3. Test Deployed API

Test with Postman using your Render URL:
- `https://online-classes-api.onrender.com/lessons`
- `https://online-classes-api.onrender.com/orders`
- etc.

##  Project Structure

```
online-classes-backend/
├── server.js              # Main Express server
├── initial-data.js        # Script to populate MongoDB
├── package.json           # Dependencies
├── .gitignore            # Git ignore file
├── public/               # Static files (images)
└── README.md             # This file
```

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lessons` | Get all lessons |
| POST | `/orders` | Create new order |
| PUT | `/lessons/:id` | Update lesson spaces |
| GET | `/search?q=query` | Search lessons |

##  Testing Checklist

- [ ] GET /lessons returns all lessons
- [ ] POST /orders creates order in database
- [ ] PUT /lessons/:id updates spaces
- [ ] GET /search works with query parameter
- [ ] Logger middleware logs all requests
- [ ] Static file middleware serves images (if added)
- [ ] CORS allows front-end connection

##  Notes

- Server uses native MongoDB driver (no Mongoose)
- CORS is enabled for front-end connection
- Logger middleware logs all requests to console
- Static file middleware serves images from /public folder

##  Troubleshooting

**MongoDB connection fails:**
- Check connection string has correct password
- Whitelist your IP in MongoDB Atlas Network Access
- Database user has correct permissions

**Render deployment fails:**
- Check build logs on Render dashboard
- Ensure package.json has correct start script
- Verify MongoDB connection string is in environment variables

**CORS errors:**
- Ensure `cors()` middleware is used in server.js
- Check front-end is making requests to correct URL

##  Resources

- Express.js: https://expressjs.com/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Render.com: https://render.com/docs
- Postman: https://www.postman.com/
