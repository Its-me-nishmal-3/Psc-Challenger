const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    preferredLanguage: { type: String, enum: ['en', 'ml'], default: 'en' },
    totalScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    googleId: { type: String },
    pushSubscriptions: [{ type: Object }], // Store VAPID subscription objects for multiple devices
    storyProgress: {
        currentLevel: { type: Number, default: 1 },
        completedLevels: [{
            levelNumber: Number,
            stars: { type: Number, min: 1, max: 3 },
            score: Number,
            date: { type: Date, default: Date.now }
        }]
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
