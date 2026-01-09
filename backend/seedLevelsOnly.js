const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./models/Question');
const Level = require('./models/Level');

dotenv.config();

const seedLevelsOnly = async () => {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Get all existing questions from database
        const allQuestions = await Question.find({});
        const allQIds = allQuestions.map(q => q._id);

        if (allQIds.length === 0) {
            throw new Error('No questions found in database! Please run seedPure.js first.');
        }

        console.log(`Found ${allQIds.length} questions in database.`);

        // Check existing levels
        const existingLevels = await Level.find({}).sort({ levelNumber: 1 });
        const maxLevel = existingLevels.length > 0
            ? Math.max(...existingLevels.map(l => l.levelNumber))
            : 0;

        console.log(`Found ${existingLevels.length} existing levels. Max level: ${maxLevel}`);

        // Seed Story Mode Levels (11-20)
        console.log('Seeding Advanced Story Mode Levels (11-20)...');
        const levelTitles = [
            "The Beginning", "Kerala Roots", "Renaissance Era",
            "Freedom Struggle", "Constitution Basics", "Scientific Mind",
            "World Explorer", "Nature's Lap", "Legendary Leaders", "The Final Frontier",
            "Constitutional Expert", "Science Mastermind", "Geography Genius",
            "History Scholar", "Literature Maven", "Economic Analyst",
            "Current Affairs Pro", "Environmental Guardian", "Sports Champion", "Ultimate Champion"
        ];

        let addedCount = 0;
        for (let i = 11; i <= 20; i++) {
            // Check if level already exists
            const existingLevel = await Level.findOne({ levelNumber: i });
            if (existingLevel) {
                console.log(`Level ${i} already exists, skipping...`);
                continue;
            }

            // Shuffle and pick 10 random questions
            const shuffled = [...allQIds].sort(() => 0.5 - Math.random());
            const levelQuestions = shuffled.slice(0, 10);

            const lvl = new Level({
                levelNumber: i,
                title: levelTitles[i - 1] || `Level ${i}`,
                description: `Master the advanced challenges of level ${i}`,
                questionIds: levelQuestions,
                minScoreToUnlock: 7 // Advanced levels require 7/10
            });
            await lvl.save();
            addedCount++;
            console.log(`✓ Seeded Level ${i}: ${levelTitles[i - 1]}`);
        }

        console.log(`\n🚀 LEVELS SEED COMPLETE!`);
        console.log(`Added ${addedCount} new levels (11-20)`);
        console.log(`Total levels in database: ${await Level.countDocuments()}`);
        process.exit(0);

    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedLevelsOnly();
