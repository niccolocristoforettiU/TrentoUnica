// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // 'Bearer <token>'
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Invalid token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

exports.authorizeRole = (role) => {
  return async (req, res, next) => {
    try {
      if (req.user.role !== role) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      // Verifica che gli organizzatori siano approvati
      if (role === 'organizer') {
        const organizer = await User.findById(req.user.userId);
        if (!organizer || !organizer.verified) {
          return res.status(403).json({ message: 'Access denied. Organizer not verified.' });
        }
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
