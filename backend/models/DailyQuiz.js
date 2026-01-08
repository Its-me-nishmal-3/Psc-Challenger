const mongoose = require('mongoose');

const DailyQuizSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    publishedAt: { type: Date }
});

module.exports = mongoose.model('DailyQuiz', DailyQuizSchema);
