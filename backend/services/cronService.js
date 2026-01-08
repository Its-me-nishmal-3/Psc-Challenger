const cron = require('node-cron');
const Question = require('../models/Question');
const DailyQuiz = require('../models/DailyQuiz');
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const geminiService = require('./geminiService');
const notificationService = require('./notificationService');

const startCron = () => {

    // ==========================================
    // 1. 📅 Daily Quiz Publisher (8:00 PM IST)
    // ==========================================
    cron.schedule('0 20 * * *', async () => {
        console.log('Running Daily Quiz Publisher Cron...');
        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if already exists
            const existing = await DailyQuiz.findOne({ date: today });
            if (existing) {
                console.log('Quiz already exists for today.');
                return;
            }

            // [Auto-Refill Logic - Kept Same]
            const count = await Question.countDocuments({ approved: true });
            if (count < 10) {
                console.log('Low Question Pool. Triggering Auto-Refill...');
                try {
                    const needed = 15 - count;
                    const newQuestions = await geminiService.generateQuestions('General Knowledge', needed, 'medium');
                    const processed = newQuestions.map(q => ({
                        ...q, source: 'ai-auto', approved: true, createdAt: new Date()
                    }));
                    await Question.insertMany(processed);
                } catch (aiErr) { console.error('Auto-Refill Failed:', aiErr); }
            }

            // Fetch Questions
            const questions = await Question.aggregate([
                { $match: { approved: true } },
                { $sample: { size: 10 } }
            ]);

            if (questions.length < 10) {
                console.error('Not enough approved questions.');
                return;
            }

            await DailyQuiz.create({
                date: today,
                questionIds: questions.map(q => q._id),
                publishedAt: new Date()
            });

            console.log(`Daily Quiz published for ${today}`);

            // === MAGIC 1: Daily Broadcast ===
            // Target: All users with subscriptions
            const users = await User.find({ pushSubscriptions: { $exists: true, $not: { $size: 0 } } });

            users.forEach(user => {
                let title = "Daily Quiz Live! 🔥";
                let body = "Today's challenge is ready. Can you score 10/10?";

                // Magic Personalization:
                if (user.streak > 5) {
                    body = `Defend your ${user.streak}-day streak! Play now.`;
                } else if (user.totalScore === 0) {
                    title = "Start your journey! 🚀";
                    body = "Your first quiz awaits. Give it a shot!";
                }

                notificationService.sendToUser(user, { title, body, url: '/quiz' });
            });

        } catch (err) {
            console.error('Error in Daily Cron:', err);
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });


    // ==========================================
    // 2. ⏳ Streak Savior (11:00 PM IST)
    // ==========================================
    cron.schedule('0 23 * * *', async () => {
        console.log('Running Streak Savior Cron...');
        try {
            const today = new Date().toISOString().split('T')[0];

            // Find users who have > 0 streak but NO attempt today
            // 1. Get all users with streak > 0 and active subscriptions
            const atRiskUsers = await User.find({
                streak: { $gt: 0 },
                pushSubscriptions: { $exists: true, $not: { $size: 0 } }
            });

            // 2. Check Attempts for today
            for (const user of atRiskUsers) {
                const attempt = await Attempt.findOne({ userId: user._id, date: today, mode: 'daily' });

                if (!attempt) {
                    // THEY FORGOT! Send Warning.
                    console.log(`Streak Warning for ${user.name} (Streak: ${user.streak})`);

                    const payload = {
                        title: "⏳ 1 Hour Left!",
                        body: `Don't lose your ${user.streak}-day streak! Play now to keep it alive.`,
                        url: '/quiz'
                    };

                    notificationService.sendToUser(user, payload);
                }
            }

        } catch (err) {
            console.error('Error in Streak Savior:', err);
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });

    // ==========================================
    // 3. 👥 Community Buzz (9:30 PM IST)
    // ==========================================
    cron.schedule('30 21 * * *', async () => {
        console.log('Running Community Buzz Cron...');
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Get Top Scorers for Today
            const highScorers = await Attempt.find({ date: today, mode: 'daily', score: { $gte: 1 } }) // At least some score
                .sort({ score: -1 })
                .limit(5)
                .populate('userId', 'name');

            if (highScorers.length < 2) {
                console.log('Not enough players for Community Buzz.');
                return;
            }

            // Pick 2 random names from top 5
            const shuffled = highScorers.sort(() => 0.5 - Math.random());
            const userA = shuffled[0].userId.name.split(' ')[0];
            const userB = shuffled[1].userId.name.split(' ')[0];

            // 2. Find Inactive Users (No attempt today) & Subscribe
            // Optimization: Get ALL subscribers, then filter out those who attempted.
            // For large scale, do this in DB query. For now, manageable.
            const allSubscribers = await User.find({ pushSubscriptions: { $exists: true, $not: { $size: 0 } } });

            for (const user of allSubscribers) {
                const hasPlayed = await Attempt.exists({ userId: user._id, date: today, mode: 'daily' });
                if (!hasPlayed) {
                    notificationService.sendToUser(user, {
                        title: "👀 Everyone's playing!",
                        body: `${userA} and ${userB} just aced today's quiz! Can you beat them?`,
                        url: '/quiz'
                    });
                }
            }
            console.log(`Sent Community Buzz using ${userA} and ${userB}`);

        } catch (err) {
            console.error('Error in Community Buzz:', err);
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });

};

module.exports = { startCron };
