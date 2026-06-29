const express = require('express');
const router = express.Router();
const { getDashboard, getAllTrips, createTrip, updateTrip, deleteTrip, getAllBookings, getAllUsers, toggleUserBan } = require('./adminController');
const { protect, adminOnly } = require('./auth');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);

router.get('/trips', getAllTrips);
router.post('/trips', createTrip);
router.put('/trips/:id', updateTrip);
router.delete('/trips/:id', deleteTrip);

router.get('/bookings', getAllBookings);

router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleUserBan);

module.exports = router;
