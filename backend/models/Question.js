const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    question: {
        en: { type: String, required: true },
        ml: { type: String, required: true }
    },
    options: [{
        en: { type: String, required: true },
        ml: { type: String, required: true }
    }],
    correctAnswerIndex: { // 0-3
        type: Number,
        required: true
    },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    gradeLevel: { type: Number, min: 5, max: 10 }, // Added Grade Level 5-10
    source: { type: String, enum: ['manual', 'ai', 'bulk-schedule', 'ai-auto'], required: true },
    approved: { type: Boolean, default: false },
    reports: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);
