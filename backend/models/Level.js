const mongoose = require('mongoose');

const LevelSchema = new mongoose.Schema({
    levelNumber: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    minScoreToUnlock: { type: Number, default: 7 }, // Score required out of total questions (usually 10)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Level', LevelSchema);
