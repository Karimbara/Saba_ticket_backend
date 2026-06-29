const Booking = require('./Booking');
const Trip = require('./Trip');
const { sendTicketEmail } = require('./helpers');

// @route POST /api/bookings/create
exports.createBooking = async (req, res) => {
  try {
    const { tripId, passengers, seatClass = 'economy' } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.status === 'cancelled') return res.status(400).json({ success: false, message: 'Trip is cancelled' });
    if (trip.availableSeats < passengers.length)
      return res.status(400).json({ success: false, message: 'Not enough seats available' });

    const requestedSeats = passengers.map(p => p.seatNumber);
    const alreadyBooked = trip.seats.filter(s => requestedSeats.includes(s.seatNumber) && s.isBooked);
    if (alreadyBooked.length > 0)
      return res.status(400).json({ success: false, message: `Seats already booked: ${alreadyBooked.map(s => s.seatNumber).join(', ')}` });

    const pricePerSeat = trip.price[seatClass] || trip.price.economy;
    const totalAmount = pricePerSeat * passengers.length;

    const booking = await Booking.create({
      user: req.user.id,
      trip: tripId,
      passengers,
      seatClass,
      totalAmount,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Booking created, proceed to payment',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        totalAmount: booking.totalAmount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/bookings/my-bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('trip', 'type name from to departureTime arrivalTime')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id })
      .populate('trip')
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id }).populate('trip');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.bookingStatus === 'cancelled')
      return res.status(400).json({ success: false, message: 'Already cancelled' });

    const now = new Date();
    const departure = new Date(booking.trip.departureTime);
    const hoursUntilDeparture = (departure - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 2)
      return res.status(400).json({ success: false, message: 'Cannot cancel within 2 hours of departure' });

    const refundPercent = hoursUntilDeparture > 24 ? 0.8 : 0.5;
    const refundAmount = booking.paymentStatus === 'paid' ? Math.round(booking.totalAmount * refundPercent) : 0;

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    booking.refundAmount = refundAmount;
    await booking.save();

    await Trip.findByIdAndUpdate(booking.trip._id, {
      $inc: { availableSeats: booking.passengers.length },
      $set: { 'seats.$[elem].isBooked': false, 'seats.$[elem].bookedBy': null }
    }, {
      arrayFilters: [{ 'elem.seatNumber': { $in: booking.passengers.map(p => p.seatNumber) } }]
    });

    res.json({
      success: true,
      message: 'Booking cancelled',
      refundAmount,
      refundMessage: refundAmount > 0 ? `₹${refundAmount} will be refunded within 5-7 business days` : 'No refund applicable',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
