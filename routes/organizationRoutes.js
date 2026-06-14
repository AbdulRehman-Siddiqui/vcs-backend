const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const VolunteerProfile = require('../models/VolunteerProfile');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
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

        const user = await User.create({ name, email, password, role: 'organization' });
        await Organization.create({ user: user._id, organizationName: name, description: 'Please update description' });

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
            if (user.role !== 'organization') return res.status(401).json({ message: 'Not authorized as organization' });
            res.json({
                _id: user._id, name: user.name, email: user.email, role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) { next(error); }
});

router.get('/me', protect, authorize('organization'), async (req, res, next) => {
    try {
        const profile = await Organization.findOne({ user: req.user.id }).populate('user', '-password');
        res.json(profile);
    } catch (error) { next(error); }
});

router.put('/me', protect, authorize('organization'), upload.fields([{ name: 'logo' }, { name: 'verificationFile' }]), async (req, res, next) => {
    try {
        const { organizationName, description } = req.body;
        const profileFields = { organizationName, description };

        if (req.files) {
            if (req.files.logo) profileFields.logo = req.files.logo[0].path.replace(/\\/g, '/');
            if (req.files.verificationFile) profileFields.verificationFile = req.files.verificationFile[0].path.replace(/\\/g, '/');
        }

        Object.keys(profileFields).forEach(key => profileFields[key] === undefined && delete profileFields[key]);
        const profile = await Organization.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
        res.json(profile);
    } catch (error) { next(error); }
});

router.post('/opportunities', protect, authorize('organization'), upload.single('bannerImage'), async (req, res, next) => {
    try {
        const org = await Organization.findOne({ user: req.user.id });
        const { title, description, requiredSkills, date, maxVolunteers } = req.body;

        const opportunity = await Opportunity.create({
            organization: org._id, title, description,
            requiredSkills: requiredSkills ? requiredSkills.split(',') : [],
            date, maxVolunteers: maxVolunteers || 20,
            bannerImage: req.file ? req.file.path.replace(/\\/g, '/') : undefined
        });
        res.status(201).json(opportunity);
    } catch (error) { next(error); }
});

router.get('/opportunities', protect, authorize('organization'), async (req, res, next) => {
    try {
        const org = await Organization.findOne({ user: req.user.id });
        const opportunities = await Opportunity.find({ organization: org._id });
        res.json(opportunities);
    } catch (error) { next(error); }
});

router.put('/opportunities/:id', protect, authorize('organization'), upload.single('bannerImage'), async (req, res, next) => {
    try {
        const org = await Organization.findOne({ user: req.user.id });
        let opportunity = await Opportunity.findById(req.params.id);

        if (!opportunity) return res.status(404).json({ message: 'Not found' });
        if (opportunity.organization.toString() !== org._id.toString()) return res.status(401).json({ message: 'Unauthorized' });

        const updateData = { ...req.body };
        if (req.file) updateData.bannerImage = req.file.path.replace(/\\/g, '/');
        if (updateData.requiredSkills) updateData.requiredSkills = updateData.requiredSkills.split(',');

        opportunity = await Opportunity.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(opportunity);
    } catch (error) { next(error); }
});

router.delete('/opportunities/:id', protect, authorize('organization'), async (req, res, next) => {
    try {
        const org = await Organization.findOne({ user: req.user.id });
        const opportunity = await Opportunity.findById(req.params.id);

        if (!opportunity) return res.status(404).json({ message: 'Not found' });
        if (opportunity.organization.toString() !== org._id.toString()) return res.status(401).json({ message: 'Unauthorized' });

        await Opportunity.deleteOne({ _id: req.params.id });
        res.json({ message: 'Deleted successfully' });
    } catch (error) { next(error); }
});

router.get('/opportunities/:id/applications', protect, authorize('organization'), async (req, res, next) => {
    try {
        const org = await Organization.findOne({ user: req.user.id });
        const opportunity = await Opportunity.findById(req.params.id);
        if (opportunity.organization.toString() !== org._id.toString()) return res.status(401).json({ message: 'Unauthorized' });

        const applications = await Application.find({ opportunity: req.params.id }).populate('volunteer', 'name email');
        res.json(applications);
    } catch (error) { next(error); }
});

router.put('/applications/:id/status', protect, authorize('organization'), async (req, res, next) => {
    try {
        const { status } = req.body; 
        const application = await Application.findById(req.params.id).populate('opportunity');
        const org = await Organization.findOne({ user: req.user.id });

        if (application.opportunity.organization.toString() !== org._id.toString()) return res.status(401).json({ message: 'Unauthorized' });

        if (status === 'accepted') {
            const opportunity = await Opportunity.findById(application.opportunity._id);
            if (opportunity.status === 'closed') return res.status(400).json({ message: 'Opportunity is closed' });

            const activeApp = await Application.findOne({ volunteer: application.volunteer, status: 'accepted' });
            if (activeApp && activeApp._id.toString() !== application._id.toString()) {
                return res.status(400).json({ message: 'Volunteer is already enrolled in another opportunity' });
            }

            const currentCount = await Application.countDocuments({ opportunity: opportunity._id, status: 'accepted' });
            if (currentCount >= opportunity.maxVolunteers) return res.status(400).json({ message: 'Opportunity is full' });

            application.status = 'accepted';
            await application.save();

            if (currentCount + 1 >= opportunity.maxVolunteers) {
                opportunity.status = 'closed';
                await opportunity.save();
            }
        } else {
            application.status = status;
            await application.save();
        }
        res.json(application);
    } catch (error) { next(error); }
});

// Added Endpoint: Search volunteers by skill
router.get('/volunteers/search', protect, authorize('organization'), async (req, res, next) => {
    try {
        const skillToFind = req.query.skill; 
        if (!skillToFind) return res.status(400).json({ message: 'Please provide a skill to search for' });

        const profiles = await VolunteerProfile.find({ 
            skills: { $regex: skillToFind, $options: 'i' } 
        }).populate('user', 'name email');

        res.json(profiles);
    } catch (error) { next(error); }
});

module.exports = router;