const Trip = require('../models/Trip');

// Get all trips (exclude large photo data for list)
exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().select('-photos.base64');
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single trip by ID
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new trip
exports.createTrip = async (req, res) => {
  try {
    const { name, date } = req.body;
    const newTrip = new Trip({
      name,
      date: date || new Date().toISOString().split('T')[0],
      members: [],
      expenses: [],
      photos: [],
      nextMemberId: 1,
      nextExpenseId: 1,
      nextPhotoId: 1,
    });
    const saved = await newTrip.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update trip (e.g., date)
exports.updateTrip = async (req, res) => {
  try {
    const { date } = req.body;
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { date },
      { new: true, runValidators: true }
    );
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete trip
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add member
exports.addMember = async (req, res) => {
  try {
    const { name } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const newId = trip.nextMemberId++;
    trip.members.push({ id: newId, name });
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete member (also removes their expenses)
exports.deleteMember = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const memberId = parseInt(req.params.memberId);
    trip.members = trip.members.filter(m => m.id !== memberId);
    trip.expenses = trip.expenses.filter(e => e.paidById !== memberId);
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const { name, paidById, amount } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Ensure paidById exists
    if (!trip.members.some(m => m.id === paidById)) {
      return res.status(400).json({ error: 'Payer not a member' });
    }

    const newId = trip.nextExpenseId++;
    trip.expenses.push({ id: newId, name, paidById, amount });
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const expenseId = parseInt(req.params.expenseId);
    trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add photo (base64)
exports.addPhoto = async (req, res) => {
  try {
    const { base64 } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const newId = trip.nextPhotoId++;
    trip.photos.push({ id: newId, base64 });
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete photo
exports.deletePhoto = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const photoId = parseInt(req.params.photoId);
    trip.photos = trip.photos.filter(p => p.id !== photoId);
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};