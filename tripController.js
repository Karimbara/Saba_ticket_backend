const Trip = require('../models/Trip');

// @route GET /api/trips/search
// @query from, to, date, type, passengers
exports.searchTrips = async (req, res) => {
  try {
    const { from, to, date, type, passengers = 1 } = req.query;

    if (!from || !to || !date)
      return res.status(400).json({ success: false, message: 'from, to, date are required' });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      'from.city': { $regex: from, $options: 'i' },
      'to.city': { $regex: to, $options: 'i' },
      departureTime: { $gte: startOfDay, $lte: endOfDay },
      availableSeats: { $gte: parseInt(passengers) },
      status: 'scheduled',
    };

    if (type) query.type = type;

    const trips = await Trip.find(query).sort({ departureTime: 1 });

    res.json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/trips/:id
exports.getTripDetails = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/trips/:id/seats
exports.getTripSeats = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).select('seats totalSeats availableSeats type');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, seats: trip.seats, totalSeats: trip.totalSeats, availableSeats: trip.availableSeats, type: trip.type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
