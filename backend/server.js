const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

/* -----------------------------
   Import Routes
------------------------------*/
const authRoutes = require('./routes/auth');
const voteRoutes = require('./routes/vote');
const candidateRoutes = require('./routes/candidate');

const app = express();
const PORT = process.env.PORT || 8000;


/* -----------------------------
   Middleware
------------------------------*/
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());


/* -----------------------------
   Request Logger
------------------------------*/
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});


/* -----------------------------
   MongoDB Connection
------------------------------*/
const connectDB = async () => {
  try {

    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/votingDB';

    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB Connected');
    console.log(`📦 Database: ${mongoose.connection.name}`);

  } catch (error) {

    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);

  }
};


/* -----------------------------
   Health Check Route
------------------------------*/
app.get('/', (req, res) => {

  res.json({
    message: "Biometric Voting API Running 🗳",
    status: "healthy",
    database: mongoose.connection.readyState === 1
      ? "Connected ✅"
      : "Disconnected ❌",
    time: new Date().toISOString()
  });

});


/* -----------------------------
   API Routes
------------------------------*/
app.use('/api/auth', authRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/candidates', candidateRoutes);


/* -----------------------------
   Global Error Handler
------------------------------*/
app.use((err, req, res, next) => {

  console.error("Unhandled error:", err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(400).json({
      error: `${field} already exists`
    });
  }

  res.status(500).json({
    error: "Internal server error"
  });

});


/* -----------------------------
   404 Handler
------------------------------*/
app.use((req, res) => {

  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`
  });

});


/* -----------------------------
   Start Server
------------------------------*/
const startServer = async () => {

  try {

    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {

    console.error("❌ Failed to start server:", error);
    process.exit(1);

  }

};

startServer();

module.exports = app;