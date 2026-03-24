const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const tripRoutes = require('./routes/tripRoutes');

const app = express();

// Render uses dynamic port, default to 5000 for local
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/trips', tripRoutes);

// Optional: Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// --- DATABASE CONNECTION ---
// 1. Indha "Old Driver" string DNS issues-ai solve pannum
// 2. Database Name (tripsplit) add panniyiruken
const mongoURI = process.env.MONGODB_URI || 'mongodb://marcelloarun:12345@ac-3rbf8h0-shard-00-00.qbczhht.mongodb.net:27017,ac-3rbf8h0-shard-00-01.qbczhht.mongodb.net:27017,ac-3rbf8h0-shard-00-02.qbczhht.mongodb.net:27017/tripsplit?ssl=true&replicaSet=atlas-v6t8db-shard-0&authSource=admin&appName=Cluster0';

mongoose.connect(mongoURI)
.then(() => {
  console.log('✅ MongoDB connected');
  // Port-ah '0.0.0.0' bind panni start panradhu Render-ku romba mukkiyam
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  // Fail aana nichayam error log varum
  process.exit(1);
});