// routes/tratteRoutes.js
const express = require('express');
const router = express.Router();
const {
  checkUsersProximity,
  checkTrattaForEvent
} = require('../controllers/tratteController');

router.post('/check-proximity', checkUsersProximity);
router.get('/check-event/:eventId', checkTrattaForEvent);

module.exports = router;
