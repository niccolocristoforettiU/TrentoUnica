// src/routes/eventSearchRoutes.js

const express = require('express');
const { searchEvents } = require('../controllers/eventSearchController');
const router = express.Router();

// Rotta per la ricerca degli eventi
router.get('/search', searchEvents);

module.exports = router;
