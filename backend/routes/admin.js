const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const geminiService = require('../services/geminiService');
const User = require('../models/User');
const Question = require('../models/Question');
const DailyQuiz = require('../models/DailyQuiz');
const Attempt = require('../models/Attempt');

router.use(verifyToken, isAdmin);

// Create Quiz (Manual or Auto)
router.post('/quiz', async (req, res) => {
    const { date, autoFill, questionsCount = 5 } = req.body;
    try {
        let quiz = await DailyQuiz.findOne({ date });
        if (quiz) return res.status(400).json({ message: 'Quiz already exists for this date' });

        let questionIds = [];
        if (autoFill) {
            const count = await Question.countDocuments({ approved: true });
            if (count < questionsCount) return res.status(400).json({ message: 'Not enough approved questions' });

            const random = await Question.aggregate([
                { $match: { approved: true } },
                { $sample: { size: Number(questionsCount) } }
            ]);
            questionIds = random.map(q => q._id);
        }

        // Set publishedAt to 8 PM of the given date (IST)
        const publishDate = new Date(`${date}T20:00:00.000+05:30`);

        quiz = await DailyQuiz.create({
            date,
            questionIds,
            publishedAt: publishDate
        });

        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

// Bulk Schedule Quizzes
router.post('/quiz/bulk-schedule', async (req, res) => {
    const { schedules } = req.body; // Array of { date, questions: [...] }
    if (!Array.isArray(schedules)) return res.status(400).json({ message: 'Invalid format' });

    try {
        const results = [];
        for (const item of schedules) {
            const { date, questions } = item;

            if (questions.length > 10) {
                return res.status(400).json({
                    message: `Too many questions for date ${date}. Maximum allowed is 10.`
                });
            }

            // 1. Create Questions
            const savedQuestions = await Question.insertMany(questions.map(q => ({
                ...q,
                source: 'bulk-schedule',
                approved: true
            })));

            const questionIds = savedQuestions.map(q => q._id);
            const publishDate = new Date(`${date}T20:00:00.000+05:30`);

            const quiz = await DailyQuiz.findOneAndUpdate(
                { date },
                { date, questionIds, publishedAt: publishDate },
                { upsert: true, new: true }
            );
            results.push(quiz);
        }
        res.json({ message: `Scheduled ${results.length} quizzes`, results });
    } catch (err) {
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

// Update Quiz
router.patch('/quiz/:id', async (req, res) => {
    try {
        const { date, publishedAt } = req.body;
        const updates = {};
        if (date) updates.date = date;
        if (publishedAt) updates.publishedAt = publishedAt;

        const quiz = await DailyQuiz.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all questions (filter by approval)
router.get('/questions', async (req, res) => {
    const { approved } = req.query;
    const filter = {};
    if (approved !== undefined) filter.approved = approved === 'true';

    try {
        const questions = await Question.find(filter).sort({ createdAt: -1 });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Approve Question
router.patch('/questions/:id/approve', async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
        res.json(question);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get All Users (with stats)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({})
            .select('name email mobile role totalScore streak lastActiveDate createdAt')
            .sort({ totalScore: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Bulk Upload Questions (Only Questions)
router.post('/questions/bulk', async (req, res) => {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Invalid data format.' });
    }

    try {
        const processed = questions.map(q => ({
            ...q,
            source: 'manual',
            approved: true,
            createdAt: new Date()
        }));

        const saved = await Question.insertMany(processed);
        res.json({ message: `Successfully added ${saved.length} questions`, count: saved.length });
    } catch (err) {
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

// Generate Questions via AI
router.post('/questions/generate', async (req, res) => {
    const { topic, count, difficulty } = req.body;
    try {
        const questions = await geminiService.generateQuestions(topic, count, difficulty);
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: 'AI Generation Failed: ' + err.message });
    }
});

// Get Quiz Details (with questions populated)
router.get('/quiz/:id', async (req, res) => {
    try {
        const quiz = await DailyQuiz.findById(req.params.id).populate('questionIds');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Question Content
router.put('/question/:id', async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(question);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get All Quizzes
router.get('/quizzes', async (req, res) => {
    try {
        const quizzes = await DailyQuiz.find({})
            .sort({ date: -1 });
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete Quiz (Only if not yet published/live)
router.delete('/quiz/:id', async (req, res) => {
    try {
        const quiz = await DailyQuiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Check if published
        if (quiz.publishedAt && new Date(quiz.publishedAt) <= new Date()) {
            return res.status(400).json({ message: 'Cannot delete a published quiz. Edit it instead.' });
        }

        await DailyQuiz.findByIdAndDelete(req.params.id);
        res.json({ message: 'Quiz deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get System Stats
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalUsers = await User.countDocuments();
        const newUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }); // Last 7 days

        // DAU: Attempts today (Unique Users)
        // Note: 'date' in Attempt is string YYYY-MM-DD.
        const todayStr = new Date().toISOString().split('T')[0];
        const dau = await Attempt.distinct('userId', { date: todayStr });

        res.json({
            totalUsers,
            newUsers, // last 7 days
            dau: dau.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Reported Questions
router.get('/questions/reported', async (req, res) => {
    try {
        const questions = await Question.find({ 'reports.0': { $exists: true } }).populate('reports.userId', 'name');
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
