const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const tripRoutes = require('./routes/tripRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend (optional – for local development)
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/trips', tripRoutes);

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripsplit';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});