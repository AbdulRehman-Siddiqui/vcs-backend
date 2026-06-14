const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: { type: [String], required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    maxVolunteers: { type: Number, default: 20 },
    bannerImage: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Opportunity', opportunitySchema);