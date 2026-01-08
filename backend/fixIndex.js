const mongoose = require('mongoose');
require('dotenv').config();
const Attempt = require('./models/Attempt');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    try {
        await mongoose.connection.collection('attempts').dropIndex('userId_1_date_1');
        console.log('Dropped strict unique index on attempts.');
    } catch (e) {
        console.log('Index might not exist or verify name:', e.message);
    }

    process.exit();
}

fix();
