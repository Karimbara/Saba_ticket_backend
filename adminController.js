const User = require('../models/User');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');

// ── DASHBOARD ──────────────────────────────────────────
// @route GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalTrips, totalBookings, revenueResult, recentBookings] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Trip.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.find({ bookingStatus: 'confirmed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('trip', 'from to departureTime type'),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTrips,
        totalBookings,
        totalRevenue: revenueResult[0]?.total || 0,
      },
      recentBookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TRIP MANAGEMENT ───────────────────────────────────
// @route GET /api/admin/trips
exports.getAllTrips = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .sort({ departureTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(query);

    res.json({ success: true, total, page: parseInt(page), trips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/admin/trips
exports.createTrip = async (req, res) => {
  try {
    const { totalSeats, ...rest } = req.body;

    // Auto-generate seat list
    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      seatNumber: `S${String(i + 1).padStart(2, '0')}`,
      isBooked: false,
      bookedBy: null,
    }));

    const trip = await Trip.create({ ...rest, totalSeats, availableSeats: totalSeats, seats });
    res.status(201).json({ success: true, message: 'Trip created', trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/admin/trips/:id
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, message: 'Trip updated', trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/admin/trips/:id
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── BOOKING MANAGEMENT ────────────────────────────────
// @route GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.bookingStatus = status;

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('trip', 'type name from to departureTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({ success: true, total, page: parseInt(page), bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── USER MANAGEMENT ───────────────────────────────────
// @route GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/admin/users/:id/ban
exports.toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // Simple toggle via isVerified flag (or add isBanned field to schema)
    user.isVerified = !user.isVerified;
    await user.save();
    res.json({ success: true, message: `User ${user.isVerified ? 'unbanned' : 'banned'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
