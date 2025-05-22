const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { getTicketForEvent, getClientBookings, createBooking } = require('../controllers/bookingController');

router.get('/ticket/:eventId', authenticate, getTicketForEvent);
router.get('/client', authenticate, getClientBookings);
router.post('/', authenticate, createBooking); // 👈 aggiunta questa riga

module.exports = router;
