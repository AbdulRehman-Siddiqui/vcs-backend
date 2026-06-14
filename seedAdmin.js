// One-time script to create an admin account.
// HOW TO USE:
// 1. Set the admin email and password below.
// 2. Make sure MongoDB is running.
// 3. From the backend folder run:  node seedAdmin.js
// 4. It will print the login details. You can then delete this file.

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const ADMIN_NAME = 'Site Admin';
const ADMIN_EMAIL = 'admin@vcs.com';
const ADMIN_PASSWORD = 'admin123';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vcs_db');
    console.log('Connected to database');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log('An account with this email already exists. Nothing to do.');
      process.exit(0);
    }

    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log('Admin created successfully!');
    console.log('Login with:');
    console.log('  Email:    ' + ADMIN_EMAIL);
    console.log('  Password: ' + ADMIN_PASSWORD);
    process.exit(0);
  } catch (error) {
    console.log('Error creating admin: ' + error.message);
    process.exit(1);
  }
}

seedAdmin();
