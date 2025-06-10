const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

describe('Creazione Organizzatore Trasporti', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe creare un utente trasporti verificato', async () => {
    await User.deleteOne({ role: 'trasporti' });

    const password = process.env.TRASPORTI_PASSWORD || "Password123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: "Trasporti",
      email: process.env.TRASPORTI_EMAIL || "trasporti@trasporti.com",
      password: hashedPassword,
      role: "trasporti",
      verified: true
    });

    const saved = await user.save();
    expect(saved).toHaveProperty('_id');
    expect(saved.role).toBe('trasporti');
    expect(saved.verified).toBe(true);
  });
});
