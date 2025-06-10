const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

describe('Creazione Admin', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('dovrebbe creare un admin verificato', async () => {
    await User.deleteOne({ role: 'admin' });

    const password = process.env.ADMIN_PASSWORD || "Password123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      name: "Admin",
      email: process.env.ADMIN_EMAIL || "admin@admin.com",
      password: hashedPassword,
      role: "admin",
      verified: true
    });

    const saved = await admin.save();
    expect(saved).toHaveProperty('_id');
    expect(saved.role).toBe('admin');
    expect(saved.verified).toBe(true);
  });
});
