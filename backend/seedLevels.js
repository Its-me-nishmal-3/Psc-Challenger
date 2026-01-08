const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Level = require('./models/Level');
const Question = require('./models/Question');

dotenv.config({ path: './.env' }); // Explicit path

const levelsData = [
    {
        levelNumber: 1,
        title: "The Awakening",
        description: "Your journey begins in the humble village of Knowledge. Prove your basics to proceed.",
        difficulty: "easy",
        minScoreToUnlock: 6
    },
    {
        levelNumber: 2,
        title: "The Forest of Words",
        description: "The path thickens with tricky vocabulary. Watch your step!",
        difficulty: "medium",
        minScoreToUnlock: 7
    },
    {
        levelNumber: 3,
        title: "The Grammar Citadel",
        description: "Only the disciplined can pass the gates of structure and rules.",
        difficulty: "medium",
        minScoreToUnlock: 7
    },
    {
        levelNumber: 4,
        title: "The Translation Spire",
        description: "Navigate the heights of bilingual mastery. Precision is key.",
        difficulty: "hard",
        minScoreToUnlock: 8
    },
    {
        levelNumber: 5,
        title: "The Scholar's Throne",
        description: "The final test. Claim your title as the Master Scholar.",
        difficulty: "hard",
        minScoreToUnlock: 9
    }
];

const seedLevels = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for Seeding');

        // Clear existing levels to avoid duplicates or conflicts
        await Level.deleteMany({});
        console.log('Cleared existing levels');

        // Fetch Questions
        const allQuestions = await Question.find({});
        if (allQuestions.length < 50) {
            console.log('Warning: Not enough questions to fully populate unique levels. Recycling questions.');
        }

        // Shuffle questions helper
        const shuffle = (array) => array.sort(() => 0.5 - Math.random());
        const shuffledQuestions = shuffle([...allQuestions]);

        let qIndex = 0;

        for (const level of levelsData) {
            // Assign 10 questions per level from the shuffled pool
            // If we run out, wrap around
            const levelQuestions = [];
            for (let i = 0; i < 10; i++) {
                if (qIndex >= shuffledQuestions.length) qIndex = 0; // Wrap around
                levelQuestions.push(shuffledQuestions[qIndex]._id);
                qIndex++;
            }

            await Level.create({
                ...level,
                questionIds: levelQuestions
            });
            console.log(`Created Level ${level.levelNumber}: ${level.title}`);
        }

        console.log('Seeding Complete');
        process.exit(0);
    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedLevels();
