const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const DailyQuiz = require('../models/DailyQuiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const Question = require('../models/Question');
const notificationService = require('../services/notificationService');

router.use(verifyToken);

// Helper: Get Active Quiz Date (Changes at 8 PM)
const getActiveQuizDate = () => {
    const now = new Date();
    // If before 8 PM (20:00), active quiz belongs to Yesterday.
    // If after 8 PM, active quiz belongs to Today.
    // However, our Cron runs at 8 PM to CREATE "today's" quiz.
    // So if Cron ran today at 8 PM, the date stored is "YYYY-MM-DD" (today).

    // Logic: Look for the most recent quiz published within last 24 hours?
    // Or just fetch the latest DailyQuiz sorted by date desc limit 1?
    return now;
};

// Get ACTIVE Quiz (The one published most recently)
router.get('/active', async (req, res) => {
    try {
        // Find latest published quiz
        const quiz = await DailyQuiz.findOne({ publishedAt: { $lte: new Date() } })
            .sort({ publishedAt: -1 })
            .populate('questionIds', '-correctAnswerIndex'); // Hide answers

        if (!quiz) {
            return res.status(404).json({ message: 'No active quiz found' });
        }

        // Check if user attempted THIS specific quiz date
        const attempt = await Attempt.findOne({ userId: req.user.id, date: quiz.date, mode: 'daily' });

        // Return quiz with attempt status
        res.json({ quiz, attempted: !!attempt, attempt });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Archive (List of Past Quizzes)
router.get('/archive', async (req, res) => {
    try {
        // Fetch all published quizzes
        const quizzes = await DailyQuiz.find({ publishedAt: { $lte: new Date() } })
            .sort({ publishedAt: -1 })
            .limit(30); // Last 30 days

        // Filter: If user has NOT attempted the latest (Active) quiz, hide it from Archive?
        // Or clearer: Frontend knows which is "Active". Archive is just a list.
        // If I return the Active quiz here, user can click it.
        // If they click it, frontend sends `id`. Backend sees `id`, marks as 'practice'.
        // Wait, if they practice the LIVE quiz, they see answers. Then they can go to LIVE mode and get 100%.
        // So we MUST prevent practicing the LIVE quiz unless it is ALREADY attempted.

        const latest = quizzes[0]; // Assuming sorted desc
        if (!latest) return res.json([]);

        const attempt = await Attempt.findOne({ userId: req.user.id, date: latest.date, mode: 'daily' });

        let result = quizzes;
        if (!attempt) {
            // If not attempted, remove the latest (Active) one from the list
            // BUT only if it is indeed the active one (logic: published recently)
            // safe bet: remove the first one if it matches "Active" criteria or just check ID.
            // Actually, `latest` IS the active one.
            result = quizzes.filter(q => q._id.toString() !== latest._id.toString());
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Specific Quiz (Practice Mode)
router.get('/:id', async (req, res) => {
    try {
        const quiz = await DailyQuiz.findById(req.params.id).populate('questionIds', '-correctAnswerIndex');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Submit Quiz (Daily & Practice)
router.post('/submit', async (req, res) => {
    const { quizId, answers, timeTaken, mode } = req.body;
    // mode: 'daily' or 'practice'

    try {
        const quiz = await DailyQuiz.findById(quizId).populate('questionIds');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // If Daily mode, validation
        if (mode === 'daily') {
            // Check if it's actually the Active Quiz? 
            // Optional: Strict check if this quiz is the latest one.
            // For now, allow submitting any quiz as 'daily' only if not attempted before relative to THAT date.

            const existing = await Attempt.findOne({ userId: req.user.id, date: quiz.date, mode: 'daily' });
            if (existing) return res.status(400).json({ message: 'Already attempted this daily quiz' });
        }

        // Calculate Score
        let score = 0;
        const processedAnswers = [];

        answers.forEach(submit => {
            const question = quiz.questionIds.find(q => q._id.toString() === submit.questionId);
            if (question) {
                // New Schema: Answer is Index or Text? Plan said Index is safer.
                // Assuming frontend sends index or text?
                // Let's assume frontend sends INDEX (0-3).
                const isCorrect = question.correctAnswerIndex === submit.answer;
                if (isCorrect) score += 10;
                processedAnswers.push({
                    questionId: submit.questionId,
                    answer: submit.answer,
                    isCorrect
                });
            }
        });

        // Save Attempt
        const attempt = await Attempt.create({
            userId: req.user.id,
            date: quiz.date,
            answers: processedAnswers,
            score,
            timeTaken,
            mode: mode || 'practice'
        });

        // Update Stats ONLY for Daily Mode
        if (mode === 'daily') {
            const user = await User.findById(req.user.id);
            const oldScore = user.totalScore;
            // Simple Streak: If lastActive was Yesterday's Quiz Date...
            // Complex because "Yesterday" is relative to 8 PM cycle.
            // Let's simplify: If user.lastActiveDate was < 24 hours + margin?
            // OR: Compare quiz.date with user.lastQuizDate?

            // For now, increment streak blindly if it's a new day
            user.streak = (user.streak || 0) + 1; // Simplified logic, real logic needs date diff
            user.totalScore += score;
            user.lastActiveDate = new Date();
            await user.save();

            // === MAGIC 3: Rivalry Notification ===
            // Check if we passed anyone in the Top 10
            // Find users who had score BETWEEN oldScore and newScore
            // That means they were above us, but now are below us.
            const rivals = await User.find({
                totalScore: { $gt: oldScore, $lt: user.totalScore },
                _id: { $ne: user._id }
            }).limit(3); // Notify max 3 people to avoid spamstorm

            rivals.forEach(rival => {
                notificationService.sendToUser(rival, {
                    title: "👑 Leaderboard Alert!",
                    body: `${user.name} just passed you! Reclaim your spot now.`,
                    url: '/leaderboard'
                });
            });

            // === MAGIC 6: Global Celebration (Perfect Score) ===
            // Assuming 10 questions * 10 points = 100 max
            if (score === 100) {
                const allUsers = await User.find({
                    pushSubscriptions: { $exists: true, $not: { $size: 0 } },
                    _id: { $ne: user._id }
                });

                notificationService.broadcast(allUsers, {
                    title: "🔥 Perfect Score Alert!",
                    body: `${user.name.split(' ')[0]} just scored 100% on today's quiz!`,
                    url: '/leaderboard'
                });
            }
        }

        // Return detailed results for frontend review
        const results = processedAnswers.map(a => {
            const q = quiz.questionIds.find(qi => qi._id.toString() === a.questionId);
            return {
                ...a,
                correctAnswer: q ? q.correctAnswerIndex : null
            };
        });

        res.json({ score, attempt, results, correct: processedAnswers.filter(a => a.isCorrect).length, incorrect: processedAnswers.filter(a => !a.isCorrect).length });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Report Question
router.post('/question/:id/report', async (req, res) => {
    try {
        const { reason } = req.body;
        await Question.findByIdAndUpdate(req.params.id, {
            $push: { reports: { userId: req.user.id, reason } }
        });
        res.json({ message: 'Report Submitted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
