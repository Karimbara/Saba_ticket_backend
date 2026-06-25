const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const tripSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bus', 'train', 'flight'],
    required: true,
  },
  name: {
    type: String,
    required: true, // e.g., "IndiGo 6E-201", "Rajdhani Express"
  },
  from: {
    city: { type: String, required: true },
    station: { type: String },  // Airport/station name
    code: { type: String },     // DEL, BOM etc
  },
  to: {
    city: { type: String, required: true },
    station: { type: String },
    code: { type: String },
  },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  duration: { type: String },   // "2h 30m"
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  seats: [seatSchema],
  price: {
    economy: { type: Number, required: true },
    business: { type: Number },
    first: { type: Number },
  },
  amenities: [String],  // ["WiFi", "Meals", "AC"]
  status: {
    type: String,
    enum: ['scheduled', 'delayed', 'cancelled', 'completed'],
    default: 'scheduled',
  },
  operator: { type: String },   // "Air India", "IRCTC", "RedBus"
}, { timestamps: true });

// Index for fast search
tripSchema.index({ 'from.city': 1, 'to.city': 1, departureTime: 1, type: 1 });

module.exports = mongoose.model('Trip', tripSchema);
