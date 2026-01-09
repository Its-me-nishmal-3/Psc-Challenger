const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./models/Question');
const DailyQuiz = require('./models/DailyQuiz');
const Level = require('./models/Level');

dotenv.config();

// Import Question Data Chunks
const q1 = require('./data/q1');
const q2 = require('./data/q2');
const q3 = require('./data/q3');
const q4 = require('./data/q4');
const q5 = require('./data/q5');

// Combine all questions
const questionsData = [...q1, ...q2, ...q3, ...q4, ...q5];

const seedPure = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Ensure URI is available
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 1. Clear Data
        console.log('Clearing existing data...');
        await Question.deleteMany({});
        await DailyQuiz.deleteMany({});
        await Level.deleteMany({});
        console.log('Cleared Questions, DailyQuizzes, Levels.');

        console.log(`Preparing to insert ${questionsData.length} unique questions...`);

        // 2. Insert Questions
        // Transform data to match Question Schema
        const questionsToInsert = questionsData.map(q => ({
            question: {
                en: q.text,
                ml: q.translation.text
            },
            options: q.options.map((opt, i) => ({
                en: opt,
                ml: q.translation.options[i]
            })),
            correctAnswerIndex: q.correctAnswerIndex,
            topic: q.category, // Schema uses 'topic', data had 'category'
            difficulty: q.difficulty,
            source: 'manual',
            approved: true
        }));

        const insertedQuestions = await Question.insertMany(questionsToInsert);
        console.log(`Successfully inserted ${insertedQuestions.length} Questions.`);

        const allQIds = insertedQuestions.map(q => q._id);

        if (allQIds.length === 0) {
            throw new Error('No questions inserted!');
        }

        // 3. Seed Daily Quizzes (Jan 7, 2026 to Feb 7, 2026)
        console.log('Seeding Daily Quizzes...');
        const startDate = new Date('2026-01-07'); // Jan 7, 2026
        const endDate = new Date('2026-02-07');   // Feb 7, 2026
        let currentDate = new Date(startDate);

        let quizCount = 0;
        while (currentDate <= endDate) {
            // Shuffle and pick 10 random questions
            const shuffled = [...allQIds].sort(() => 0.5 - Math.random());
            const questionsForDay = shuffled.slice(0, 10);

            // Format date as YYYY-MM-DD
            const dateStr = currentDate.toISOString().split('T')[0];

            // Create Quiz
            const dq = new DailyQuiz({
                date: dateStr,
                questionIds: questionsForDay, // Schema uses 'questionIds'
                publishedAt: new Date(currentDate) // Optional but good to have
            });
            await dq.save();
            quizCount++;

            // Increment day
            currentDate.setDate(currentDate.getDate() + 1);
            console.log('Seeded Daily Quiz for', dateStr);
        }
        console.log(`Seeded ${quizCount} Daily Quizzes.`);

        // 4. Seed Story Mode Levels (10 Levels)
        console.log('Seeding Story Mode Levels...');
        const levelTitles = [
            "The Beginning", "Kerala Roots", "Renaissance Era",
            "Freedom Struggle", "Constitution Basics", "Scientific Mind",
            "World Explorer", "Nature's Lap", "Legendary Leaders", "The Final Frontier"
        ];

        for (let i = 1; i <= 10; i++) {
            // Shuffle again for levels
            const shuffled = [...allQIds].sort(() => 0.5 - Math.random());
            const levelQuestions = shuffled.slice(0, 10);

            const lvl = new Level({
                levelNumber: i,
                title: levelTitles[i - 1] || `Level ${i}`,
                description: `Unlock the secrets of level ${i}`,
                questionIds: levelQuestions, // Schema uses 'questionIds'
                minScoreToUnlock: 5 // Schema uses 'minScoreToUnlock', simplified to 5/10
                // reward removed as it's not in schema
            });
            await lvl.save();
        }
        console.log('Seeded 10 Story Mode Levels.');

        console.log('PURE SEED COMPLETE 🚀');
        console.log(`Total Pool Size: ${questionsData.length}`);
        process.exit(0);

    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedPure();
