const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('./models/Question');
const DailyQuiz = require('./models/DailyQuiz');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const qCount = await Question.countDocuments();
    const quizCount = await DailyQuiz.countDocuments();
    const quizzes = await DailyQuiz.find({});

    console.log(`Questions Count: ${qCount}`);
    console.log(`DailyQuiz Count: ${quizCount}`);

    if (quizzes.length > 0) {
        console.log('Quizzes:', JSON.stringify(quizzes, null, 2));
    } else {
        console.log('No DailyQuizzes found. This explains why Frontend is empty!');
    }

    process.exit();
}

check();
