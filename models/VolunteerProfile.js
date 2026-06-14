const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills: { type: [String], required: true },
    availability: { type: String },
    totalHours: { type: Number, default: 0 },
    profileImage: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);