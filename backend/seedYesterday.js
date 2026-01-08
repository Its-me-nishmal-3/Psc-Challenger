const mongoose = require('mongoose');
require('dotenv').config();
const DailyQuiz = require('./models/DailyQuiz');
const Question = require('./models/Question');

async function seedYesterday() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Create dummy questions
    const q1 = await Question.create({
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: "Paris",
        topic: "Geography",
        difficulty: "easy",
        source: "manual",
        approved: true
    });

    const q2 = await Question.create({
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        topic: "Math",
        difficulty: "easy",
        source: "manual",
        approved: true
    });

    // Create Yesterday's Quiz
    await DailyQuiz.create({
        date: yesterday,
        questionIds: [q1._id, q2._id],
        publishedAt: new Date(),
    });

    console.log(`Seeded quiz for ${yesterday}`);
    process.exit();
}

seedYesterday();
