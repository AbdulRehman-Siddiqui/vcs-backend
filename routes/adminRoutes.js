const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

const router = express.Router();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (user.role !== 'admin') return res.status(401).json({ message: 'Not authorized as admin' });
            res.json({
                _id: user._id, name: user.name, email: user.email, role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) { next(error); }
});

// Added Endpoint: Get ALL Users
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (error) { next(error); }
});

// Added Endpoint: Get User by ID
router.get('/users/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId, { password: 0 });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) { next(error); }
});

router.delete('/users/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'User deleted' });
    } catch (error) { next(error); }
});

// Added Endpoint: Get ALL Organizations
router.get('/organizations', protect, authorize('admin'), async (req, res, next) => {
    try {
        const organizations = await Organization.find().populate('user', 'name email');
        res.json(organizations);
    } catch (error) { next(error); }
});

router.get('/organizations/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const org = await Organization.findById(req.params.id).populate('user', 'name email');
        if (!org) return res.status(404).json({ message: 'Org not found' });
        res.json(org);
    } catch (error) { next(error); }
});

router.put('/verify-org/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ message: 'Org not found' });

        org.verified = true;
        await org.save();
        res.json({ message: 'Organization verified', org });
    } catch (error) { next(error); }
});

// Added Endpoint: Get ALL Opportunities
router.get('/opportunities', protect, authorize('admin'), async (req, res, next) => {
    try {
        const opportunities = await Opportunity.find().populate('organization', 'organizationName');
        res.json(opportunities);
    } catch (error) { next(error); }
});

router.delete('/opportunities/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        await Opportunity.deleteOne({ _id: req.params.id });
        res.json({ message: 'Opportunity deleted by admin' });
    } catch (error) { next(error); }
});

// Added Endpoint: Get ALL Applications
router.get('/applications', protect, authorize('admin'), async (req, res, next) => {
    try {
        const applications = await Application.find()
            .populate('volunteer', 'name email')
            .populate('opportunity', 'title');
        res.json(applications);
    } catch (error) { next(error); }
});

router.get('/stats', protect, authorize('admin'), async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        const orgCount = await Organization.countDocuments();
        const oppCount = await Opportunity.countDocuments();

        res.json({ users: userCount, organizations: orgCount, opportunities: oppCount });
    } catch (error) { next(error); }
});

module.exports = router;