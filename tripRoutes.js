const express = require('express');
const router = express.Router();
const { searchTrips, getTripDetails, getTripSeats } = require('./tripController');

router.get('/search', searchTrips);
router.get('/:id', getTripDetails);
router.get('/:id/seats', getTripSeats);

module.exports = router;
