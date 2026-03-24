const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const tripRoutes = require('../routes/tripRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api/trips', tripRoutes);

// Connect to MongoDB (reuse connection)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Connect before handling requests
dbConnect();

module.exports = app;