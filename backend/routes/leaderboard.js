const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attempt = require('../models/Attempt');

// Get Leaderboard
router.get('/', async (req, res) => {
    try {
        const { type } = req.query; // daily, all-time, story
        let leaderboard = [];

        if (type === 'daily') {
            // Get today's attempts
            // Date logic: For simplicity, string match YYYY-MM-DD
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];

            // Find attempts for today, sorted by score desc, then time limit asc
            // We need to populate user details
            const attempts = await Attempt.find({ date: dateStr, mode: 'daily' })
                .sort({ score: -1, timeTaken: 1 })
                .limit(50)
                .populate('userId', 'name avatar');

            leaderboard = attempts.map(a => ({
                name: a.userId?.name || 'Unknown',
                avatar: a.userId?.avatar,
                score: a.score,
                timeTaken: a.timeTaken,
                streak: 0 // Streak is on User model, simpler to skip or populate
            }));

        } else if (type === 'story') {
            // Story Mode: Sort by currentLevel DESC, then total score/stars?
            // Users with highest level are top. 
            // Tie-break: Total Score from completed levels? 
            // Or just 'stars' total?
            // Let's use: currentLevel desc, then totalScore desc (if we had it easily)
            // User model has storyProgress.currentLevel.
            // We can fetch Top 50 Users by storyProgress.currentLevel

            const users = await User.find()
                .sort({ 'storyProgress.currentLevel': -1, 'totalScore': -1 })
                .limit(50)
                .select('name avatar storyProgress totalScore streak');

            leaderboard = users.map(u => ({
                name: u.name,
                avatar: u.avatar,
                level: u.storyProgress?.currentLevel || 1,
                // Calculate total stars?
                stars: u.storyProgress?.completedLevels?.reduce((acc, l) => acc + l.stars, 0) || 0,
                score: u.totalScore || 0,
                streak: u.streak
            }));

        } else if (type === 'all-time') {
            // Global Score
            const users = await User.find()
                .sort({ totalScore: -1 })
                .limit(50)
                .select('name avatar totalScore streak');

            leaderboard = users.map(u => ({
                name: u.name,
                avatar: u.avatar,
                score: u.totalScore,
                streak: u.streak
            }));
        }

        res.json(leaderboard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
