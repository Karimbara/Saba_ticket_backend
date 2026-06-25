const express = require('express');
const bookingRouter = express.Router();
const paymentRouter = express.Router();

const { createBooking, getMyBookings, getBookingById, cancelBooking } = require('../controllers/bookingController');
const { createOrder, verifyPayment, webhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Booking routes
bookingRouter.post('/create', protect, createBooking);
bookingRouter.get('/my-bookings', protect, getMyBookings);
bookingRouter.get('/:id', protect, getBookingById);
bookingRouter.post('/:id/cancel', protect, cancelBooking);

// Payment routes
paymentRouter.post('/create-order', protect, createOrder);
paymentRouter.post('/verify', protect, verifyPayment);
paymentRouter.post('/webhook', webhook);  // No auth - Razorpay calls this

module.exports = { bookingRouter, paymentRouter };
