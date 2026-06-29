const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('./Booking');
const Trip = require('./Trip');
const User = require('./User');
const { sendTicketEmail } = require('./helpers');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Already paid' });

    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100,
      currency: 'INR',
      receipt: booking.bookingId,
      notes: { bookingId: booking._id.toString(), userId: req.user.id },
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      key: process.env.RAZORPAY_KEY_ID,
      bookingId: booking._id,
      prefill: { name: req.user.name, email: req.user.email, contact: req.user.phone },
    });
  } catch (err) {
    res.status(500).json({ success: false,
