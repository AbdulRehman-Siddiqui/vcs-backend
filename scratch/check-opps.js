const mongoose = require('mongoose');
const Opportunity = require('../models/Opportunity');

async function checkOpps() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vcs_db');
    const opps = await Opportunity.find().populate('organization');
    console.log('TOTAL OPPORTUNITIES IN DB:', opps.length);
    console.log('OPPORTUNITIES:', JSON.stringify(opps, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOpps();
