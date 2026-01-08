const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD to match DailyQuiz
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        answer: String,
        isCorrect: Boolean
    }],
    score: { type: Number, required: true },
    timeTaken: { type: Number, required: true }, // in seconds
    mode: { type: String, enum: ['daily', 'practice'], default: 'daily' },
    createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure one attempt per user per day ONLY for daily mode
AttemptSchema.index({ userId: 1, date: 1 }, { unique: true, partialFilterExpression: { mode: 'daily' } });

module.exports = mongoose.model('Attempt', AttemptSchema);
