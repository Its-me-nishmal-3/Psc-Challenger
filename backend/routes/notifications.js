const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

// Subscribe Route
router.post('/subscribe', verifyToken, async (req, res) => {
    try {
        const subscription = req.body;

        // Add to user's subscriptions if not exists
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { pushSubscriptions: subscription }
        });

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
