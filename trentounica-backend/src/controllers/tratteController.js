// controllers/tratteController.js
const User = require('../models/userModel');
const { 
  allUsersWithinRadius, 
  geographicMidpoint, 
  checkTrattaConditionsForEvent 
} = require('../utils/tratteUtils');

// 🔹 Check if a group of users is within a radius (manual check)
const checkUsersProximity = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds deve essere un array non vuoto.' });
    }

    const users = await User.find(
      { _id: { $in: userIds }, role: 'client' },
      'lat lon name email'
    );

    if (users.length < userIds.length) {
      return res.status(404).json({ message: 'Alcuni utenti non trovati.' });
    }

    const allClose = allUsersWithinRadius(users, 3);

    if (!allClose) {
      return res.status(200).json({
        allWithinRadius: false,
        message: 'Non tutti gli utenti sono entro 3 km tra loro.'
      });
    }

    const midpoint = geographicMidpoint(users);

    res.status(200).json({
      allWithinRadius: true,
      midpoint,
      users: users.map(u => ({ name: u.name, email: u.email, lat: u.lat, lon: u.lon }))
    });
  } catch (err) {
    console.error('Errore nel calcolo della vicinanza:', err);
    res.status(500).json({ message: 'Errore nel calcolo della vicinanza.' });
  }
};

// 🔹 Check tratta activation eligibility for a given event
const checkTrattaForEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({ message: 'eventId richiesto' });
  }

  try {
    await checkTrattaConditionsForEvent(eventId);
    res.status(200).json({ message: 'Controllo tratta completato (vedi log server).' });
  } catch (err) {
    console.error('Errore durante il controllo tratta:', err);
    res.status(500).json({ message: 'Errore nel controllo tratta.' });
  }
};

module.exports = {
  checkUsersProximity,
  checkTrattaForEvent
};
