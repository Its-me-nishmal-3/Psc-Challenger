const express = require('express');
const router = express.Router();
const Level = require('../models/Level');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all Levels (with user status: locked/unlocked)
router.get('/', verifyToken, async (req, res) => {
    try {
        const levels = await Level.find().sort({ levelNumber: 1 });
        const user = await User.findById(req.user.id);
        const currentLevel = user.storyProgress?.currentLevel || 1;
        const completedMap = {};

        if (user.storyProgress?.completedLevels) {
            user.storyProgress.completedLevels.forEach(c => {
                completedMap[c.levelNumber] = c.stars;
            });
        }

        const levelsWithStatus = levels.map(level => {
            const isUnlocked = level.levelNumber <= currentLevel;
            const isCompleted = level.levelNumber < currentLevel || (completedMap[level.levelNumber] !== undefined);
            const stars = completedMap[level.levelNumber] || 0;

            return {
                ...level.toObject(),
                status: isCompleted ? 'completed' : (isUnlocked ? 'unlocked' : 'locked'),
                stars,
                questionIds: undefined // Don't send Q IDs here
            };
        });

        res.json(levelsWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get specific Level Data (Questions)
router.get('/:levelNumber', verifyToken, async (req, res) => {
    try {
        const { levelNumber } = req.params;
        const user = await User.findById(req.user.id);
        const userLevel = user.storyProgress?.currentLevel || 1;

        if (parseInt(levelNumber) > userLevel && !user.storyProgress?.completedLevels?.some(c => c.levelNumber == levelNumber)) {
            // In strict mode we might block, but let's check if it's the NEXT one or completely far.
            // Actually, if it's locked, we shouldn't return questions.
            if (parseInt(levelNumber) > userLevel) {
                return res.status(403).json({ message: 'Level is locked' });
            }
        }

        const level = await Level.findOne({ levelNumber }).populate('questionIds', '-correctAnswerIndex');
        if (!level) return res.status(404).json({ message: 'Level not found' });

        res.json(level);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

const notificationService = require('../services/notificationService');

// Submit Level
router.post('/:levelNumber/submit', verifyToken, async (req, res) => {
    try {
        const { levelNumber } = req.params;
        const { answers, timeTaken } = req.body; // answers: [{ questionId, answer }]
        const user = await User.findById(req.user.id);

        const level = await Level.findOne({ levelNumber }).populate('questionIds');
        if (!level) return res.status(404).json({ message: 'Level not found' });

        let score = 0;
        level.questionIds.forEach(q => {
            const submitted = answers.find(a => a.questionId === q._id.toString());
            // Need to verify answer logic similar to Quiz.js
            // Assuming simple string match or index match depending on implementation
            // The frontend sends index (number) usually. 
            if (submitted && submitted.answer === q.correctAnswerIndex) {
                score++;
            }
        });

        const passed = score >= level.minScoreToUnlock;
        let stars = 0;
        if (passed) {
            const percentage = (score / level.questionIds.length) * 100;
            if (percentage >= 90) stars = 3;
            else if (percentage >= 70) stars = 2;
            else stars = 1;
        }

        // Update User Progress
        let leveledUp = false;
        if (passed) {
            // Check if already completed
            const existingCompletion = user.storyProgress.completedLevels.find(c => c.levelNumber == levelNumber);
            if (existingCompletion) {
                // Update score/stars if better
                if (score > existingCompletion.score) {
                    existingCompletion.score = score;
                    existingCompletion.stars = stars;
                }
            } else {
                // New completion
                user.storyProgress.completedLevels.push({
                    levelNumber: parseInt(levelNumber),
                    stars,
                    score,
                    date: new Date()
                });

                // Unlock next level if this was the current one
                if (user.storyProgress.currentLevel === parseInt(levelNumber)) {
                    user.storyProgress.currentLevel += 1;
                    leveledUp = true;
                }
            }
            await user.save();
        }

        // Trigger Notification if Leveled Up
        if (leveledUp) {
            const nextLevelNum = parseInt(levelNumber) + 1;
            // Fetch next level title if possible, or generic
            const nextLevel = await Level.findOne({ levelNumber: nextLevelNum });
            const title = nextLevel ? nextLevel.title : `Level ${nextLevelNum}`;

            notificationService.sendToUser(user, {
                title: "🎉 Level Unlocked!",
                body: `You've unlocked: ${title}. Ready to explore?`,
                url: `/story/play/${nextLevelNum}`
            });

            // Global Broadcast
            const allUsers = await User.find({
                pushSubscriptions: { $exists: true, $not: { $size: 0 } },
                _id: { $ne: user._id }
            });

            notificationService.broadcast(allUsers, {
                title: "🚀 News from Story Mode",
                body: `${user.name.split(' ')[0]} just reached Level ${nextLevelNum}!`,
                url: '/story'
            });
        }

        res.json({
            passed,
            score,
            total: level.questionIds.length,
            stars,
            leveledUp,
            nextLevel: parseInt(levelNumber) + 1,
            // Add detailed results for frontend review like Quiz.js
            results: level.questionIds.map(q => {
                const sub = answers.find(a => a.questionId === q._id.toString());
                return {
                    questionId: q._id,
                    answer: sub ? sub.answer : null,
                    correctAnswer: q.correctAnswerIndex,
                    isCorrect: sub ? sub.answer === q.correctAnswerIndex : false
                };
            })
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
