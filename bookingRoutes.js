const express = require('express');
const bookingRouter = express.Router();
const paymentRouter = express.Router();

const { createBooking, getMyBookings, getBookingById, cancelBooking } = require('./bookingController');
const { createOrder, verifyPayment, webhook } = require('./paymentController');
const { protect } = require('./auth');

// Booking routes
bookingRouter.post('/create', protect, createBooking);
bookingRouter.get('/my-bookings', protect, getMyBookings);
bookingRouter.get('/:id', protect, getBookingById);
bookingRouter.post('/:id/cancel', protect, cancelBooking);

// Payment routes
paymentRouter.post('/create-order', protect, createOrder);
paymentRouter.post('/verify', protect, verifyPayment);
paymentRouter.post('/webhook', webhook);

module.exports = { bookingRouter, paymentRouter };
