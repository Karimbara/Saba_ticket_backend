const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { sendTicketEmail } = require('../utils/helpers');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route POST /api/payment/create-order
exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Already paid' });

    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100,  // Razorpay takes amount in paise
      currency: 'INR',
      receipt: booking.bookingId,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user.id,
      },
    });

    // Save Razorpay order ID to booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
      bookingId: booking._id,
      prefill: {
        name: req.user.name,
        email: req.user.email,
        contact: req.user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/payment/verify
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed' });

    // Update booking
    const booking = await Booking.findById(bookingId).populate('trip');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.paymentStatus = 'paid';
    booking.paymentId = razorpay_payment_id;
    booking.bookingStatus = 'confirmed';
    await booking.save();

    // Mark seats as booked in Trip
    const seatNumbers = booking.passengers.map(p => p.seatNumber);
    await Trip.findByIdAndUpdate(booking.trip._id, {
      $inc: { availableSeats: -seatNumbers.length },
      $set: {
        'seats.$[elem].isBooked': true,
        'seats.$[elem].bookedBy': req.user.id,
      }
    }, {
      arrayFilters: [{ 'elem.seatNumber': { $in: seatNumbers } }]
    });

    // Send confirmation email
    try {
      const user = await User.findById(req.user.id);
      await sendTicketEmail(booking, user, booking.trip);
      booking.ticketSent = true;
      await booking.save();
    } catch (emailErr) {
      console.error('Email failed:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Payment verified! Booking confirmed.',
      booking: {
        bookingId: booking.bookingId,
        status: booking.bookingStatus,
        paymentId: razorpay_payment_id,
        totalAmount: booking.totalAmount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/payment/webhook (Razorpay webhook for failures)
exports.webhook = async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (digest !== signature) return res.status(400).json({ success: false });

  const event = req.body.event;

  if (event === 'payment.failed') {
    const orderId = req.body.payload.payment.entity.order_id;
    await Booking.findOneAndUpdate(
      { razorpayOrderId: orderId },
      { paymentStatus: 'failed' }
    );
  }

  res.json({ success: true });
};
