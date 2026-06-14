const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password, role: 'volunteer' });
        await VolunteerProfile.create({ user: user._id, skills: [] });

        res.status(201).json({
            _id: user._id, name: user.name, email: user.email, role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (user.role !== 'volunteer') return res.status(401).json({ message: 'Not authorized as volunteer' });
            res.json({
                _id: user._id, name: user.name, email: user.email, role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) { next(error); }
});

router.put('/change-password', protect, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(400).json({ message: 'Invalid current password' });
        }
        user.password = newPassword; 
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) { next(error); }
});

router.get('/me', protect, async (req, res, next) => {
    try {
        const profile = await VolunteerProfile.findOne({ user: req.user.id }).populate('user', '-password');
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json(profile);
    } catch (error) { next(error); }
});

router.put('/me', protect, upload.single('profileImage'), async (req, res, next) => {
    try {
        const { skills, availability, totalHours } = req.body;
        const profileFields = {
            skills: skills ? skills.split(',').map(s => s.trim()) : undefined,
            availability, totalHours
        };
        if (req.file) profileFields.profileImage = req.file.path.replace(/\\/g, '/');
        Object.keys(profileFields).forEach(key => profileFields[key] === undefined && delete profileFields[key]);

        const profile = await VolunteerProfile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
        res.json(profile);
    } catch (error) { next(error); }
});

router.get('/opportunities', protect, async (req, res, next) => {
    try {
        const opportunities = await Opportunity.find({ status: 'open' }).populate('organization', 'organizationName logo');
        res.json(opportunities);
    } catch (error) { next(error); }
});

router.get('/opportunities/:id', protect, async (req, res, next) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id).populate('organization', 'organizationName logo description');
        if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
        res.json(opportunity);
    } catch (error) { next(error); }
});

router.post('/apply/:opportunityId', protect, async (req, res, next) => {
    try {
        const opportunity = await Opportunity.findById(req.params.opportunityId);
        if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
        if (opportunity.status === 'closed') return res.status(400).json({ message: 'This opportunity is closed' });

        const existing = await Application.findOne({ volunteer: req.user.id, opportunity: req.params.opportunityId });
        if (existing) return res.status(400).json({ message: 'Already applied' });

        const application = await Application.create({ volunteer: req.user.id, opportunity: req.params.opportunityId });
        res.status(201).json(application);
    } catch (error) { next(error); }
});

router.get('/applications', protect, async (req, res, next) => {
    try {
        const applications = await Application.find({ volunteer: req.user.id })
            .populate({ path: 'opportunity', populate: { path: 'organization', select: 'organizationName' } });
        res.json(applications);
    } catch (error) { next(error); }
});

router.delete('/applications/:id', protect, async (req, res, next) => {
    try {
        const app = await Application.findById(req.params.id);
        if (!app) return res.status(404).json({ message: 'Application not found' });
        if (app.volunteer.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await Application.deleteOne({ _id: req.params.id });
        res.json({ message: 'Application withdrawn' });
    } catch (error) { next(error); }
});

module.exports = router;