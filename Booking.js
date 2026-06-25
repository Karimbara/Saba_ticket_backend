const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  seatNumber: { type: String, required: true },
  idType: { type: String, enum: ['aadhar', 'passport', 'pan', 'driving_license'] },
  idNumber: { type: String },
});

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
  },
  passengers: [passengerSchema],
  seatClass: {
    type: String,
    enum: ['economy', 'business', 'first'],
    default: 'economy',
  },
  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: { type: String },        // Razorpay payment ID
  razorpayOrderId: { type: String },  // Razorpay order ID
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'pending',
  },
  cancellationReason: { type: String },
  refundAmount: { type: Number, default: 0 },
  ticketSent: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate booking ID before save
bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId = 'SBT' + Date.now().toString().slice(-8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
