const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
});

const expenseSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  paidById: { type: Number, required: true },
  amount: { type: Number, required: true, min: 0 },
});

const photoSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  base64: { type: String, required: true }, // store base64 string
});

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  members: [memberSchema],
  expenses: [expenseSchema],
  photos: [photoSchema],
  nextMemberId: { type: Number, default: 1 },
  nextExpenseId: { type: Number, default: 1 },
  nextPhotoId: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);