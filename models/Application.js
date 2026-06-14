const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

applicationSchema.index({ volunteer: 1, opportunity: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);