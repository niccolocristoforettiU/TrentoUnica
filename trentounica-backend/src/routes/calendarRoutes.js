// src/routes/calendarRoutes.js
const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticate } = require('../middlewares/authMiddleware');

// Rotta per scaricare il calendario
router.get('/calendar', authenticate, calendarController.getICalendar);

module.exports = router;
