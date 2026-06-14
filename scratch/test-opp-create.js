const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Opportunity = require('../models/Opportunity');

async function testCreate() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vcs_db');
    console.log('Connected to DB');

    // Find or create an organization user
    let user = await User.findOne({ role: 'organization' });
    if (!user) {
      user = await User.create({
        name: 'Test Org User',
        email: 'orgtest@example.com',
        password: 'password123',
        role: 'organization'
      });
      console.log('Created test user');
    }

    // Find or create Organization profile
    let org = await Organization.findOne({ user: user._id });
    if (!org) {
      org = await Organization.create({
        user: user._id,
        organizationName: 'Test Org',
        description: 'Test Org Description'
      });
      console.log('Created test organization');
    }

    console.log('Org ID:', org._id);

    // Simulate opportunity creation with data that matches multipart request
    const title = 'Test Event with Image';
    const description = 'This is a description';
    const requiredSkills = 'cooking, teaching';
    const date = '2026-07-15';
    const maxVolunteers = '20'; // string, from form-data
    const filePath = 'uploads/bannerImage-1718295950123.jpg';

    const oppData = {
      organization: org._id,
      title,
      description,
      requiredSkills: requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : [],
      date: new Date(date),
      maxVolunteers: parseInt(maxVolunteers, 10) || 20,
      bannerImage: filePath
    };

    console.log('Creating opportunity with data:', oppData);
    const opportunity = await Opportunity.create(oppData);
    console.log('SUCCESS! Opportunity created:', opportunity);

    // Clean up
    await Opportunity.deleteOne({ _id: opportunity._id });
    console.log('Cleaned up test opportunity');

    process.exit(0);
  } catch (error) {
    console.error('ERROR during opportunity creation:', error);
    process.exit(1);
  }
}

testCreate();
