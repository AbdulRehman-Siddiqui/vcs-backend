const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, required: true },
    description: { type: String, required: true },
    logo: { type: String },
    verificationFile: { type: String },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Organization', organizationSchema);