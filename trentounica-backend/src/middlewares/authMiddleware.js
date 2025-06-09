exports.optionalAuthenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return next(); // Nessun token, trattato come guest
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return next(); // Token scaduto, trattato come guest
    }

    next();
  } catch (err) {
    console.warn('Token non valido, trattato come guest.');
    next(); // Token invalido → trattato come guest
  }
};

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
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Controllo se il token è scaduto
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }

    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

exports.authorizeRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      if (userRole === 'organizer') {
        const organizer = await User.findById(req.user.userId || req.user.id || req.user._id);
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