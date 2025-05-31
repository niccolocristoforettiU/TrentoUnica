const express = require('express');
const router = express.Router();

const {
    bookTratta,
    cancelTrattaBooking,
    getClientTrattaBookings,
    getTicketForTratta,
    validateTrattaTicket
} = require('../controllers/tratteBookingController');

const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');



router.post('/', authenticate, authorizeRole('client'), bookTratta);

router.delete('/:bookingId', authenticate, authorizeRole('client'), cancelTrattaBooking);

router.get('/client', authenticate, authorizeRole('client'), getClientTrattaBookings);

router.get('/ticket/:trattaId', authenticate, authorizeRole('client'), getTicketForTratta);

router.post('/validate', authenticate, validateTrattaTicket);

module.exports = router;
