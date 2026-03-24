const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const tripRoutes = require('./routes/tripRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // to handle base64 images
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/trips', tripRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/tripsplit', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});