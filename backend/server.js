const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("YOUR_MONGODB_CONNECTION_STRING")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Test Route
app.get("/", (req, res) => {
  res.send("TripSplit Backend Running");
});

// Routes
const tripRoutes = require("./routes/tripRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

app.use("/api/trips", tripRoutes);
app.use("/api/expenses", expenseRoutes);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});