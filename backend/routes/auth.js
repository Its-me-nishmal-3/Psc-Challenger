const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // Successful authentication
        const token = jwt.sign(
            { id: req.user._id, role: req.user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Redirect to client with token
        res.redirect(`${process.env.CLIENT_URL}/auth-callback?token=${token}`);
    }
);

router.post('/complete-profile', verifyToken, async (req, res) => {
    const { name, mobile, preferredLanguage } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, mobile, preferredLanguage: preferredLanguage || 'en' },
            { new: true }
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/subscribe', verifyToken, async (req, res) => {
    try {
        const subscription = req.body;
        await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
        res.status(201).json({});
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
