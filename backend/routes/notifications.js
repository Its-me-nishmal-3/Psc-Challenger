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

// Admin: Get Users Status (Allowed vs Blocked)
router.get('/admin/users-status', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    try {
        const users = await User.find({}, 'name email pushSubscriptions');

        const subscribed = users.filter(u => u.pushSubscriptions && u.pushSubscriptions.length > 0);
        const blocked = users.filter(u => !u.pushSubscriptions || u.pushSubscriptions.length === 0);

        res.json({
            subscribed: subscribed.map(u => ({ _id: u._id, name: u.name, email: u.email, deviceCount: u.pushSubscriptions.length })),
            blocked: blocked.map(u => ({ _id: u._id, name: u.name, email: u.email }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin: Send Manual Notification
router.post('/admin/send-manual', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { title, body, icon, url, recipients } = req.body;
    const { sendToUsers } = require('../services/pushService');

    try {
        let targetUsers;
        if (recipients === 'all') {
            targetUsers = await User.find({ pushSubscriptions: { $exists: true, $not: { $size: 0 } } });
        } else if (Array.isArray(recipients)) {
            targetUsers = await User.find({ _id: { $in: recipients } });
        } else {
            return res.status(400).json({ message: 'Invalid recipients' });
        }

        const payload = { title, body, icon, url }; // Ensure payload structure matches sw.js expectation
        const results = await sendToUsers(targetUsers, payload);

        res.json({ message: 'Notifications sent', results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
